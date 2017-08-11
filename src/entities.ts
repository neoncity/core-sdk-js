import * as r from 'raynor'
import { ArrayOf, ExtractError, Marshaller, MarshalEnum, MarshalFrom, MarshalWith } from 'raynor'

import { Currency, CurrencyMarshaller, IBAN, IBANMarshaller } from '@neoncity/common-js'
import { Session } from '@neoncity/identity-sdk-js'


export enum CauseState {
    Unknown = 0,
    Active = 1,
    Succeeded = 2,
    Removed = 3
}


export class TitleMarshaller extends r.MaxLengthStringMarshaller {
    constructor() {
        super(128);
    }

    filter(s: string): string {
        var title = s.trim();

        if (title == '') {
            throw new ExtractError('Expected a non empty string');
        }

        return title;
    }
}


export class DescriptionMarshaller extends r.MaxLengthStringMarshaller {
    constructor() {
        super(10 * 1024);
    }

    filter(s: string): string {
        var title = s.trim();

        if (title == '') {
            throw new ExtractError('Expected a non empty string');
        }

        return title;
    }
}


export class FacebookPostIdMarshaller extends r.MaxLengthStringMarshaller {
    private static readonly _numberRegExp: RegExp = new RegExp('^[0-9]+$');

    constructor() {
        super(128);
    }

    filter(s: string): string {
        if (!FacebookPostIdMarshaller._numberRegExp.test(s)) {
            throw new ExtractError('Expected a post id');
        }

        return s;
    }
}


export class Picture {
    @MarshalWith(r.PositiveIntegerMarshaller)
    position: number;

    @MarshalWith(r.SecureWebUriMarshaller)
    uri: string;

    @MarshalWith(r.PositiveIntegerMarshaller)
    width: number;

    @MarshalWith(r.PositiveIntegerMarshaller)
    height: number;
}


export class PictureSet {
    public static readonly MAX_NUMBER_OF_PICTURES = 25;

    @MarshalWith(ArrayOf(MarshalFrom(Picture)))
    pictures: Picture[];

    constructor() {
        this.pictures = [];
    }
}


/// This should be PictureSetMarshaller extends MarshalFrom(PictureSet). But TypeScript
/// can't yet handle this pattern properly when it comes to generating .d.ts files.
export class PictureSetMarshaller implements Marshaller<PictureSet> {
    private static readonly _basicMarshaller = new (MarshalFrom(PictureSet))();

    extract(raw: any): PictureSet {
        const pictureSet = PictureSetMarshaller._basicMarshaller.extract(raw);

        if (pictureSet.pictures.length > PictureSet.MAX_NUMBER_OF_PICTURES) {
            throw new ExtractError('Expected less than MAX_NUMBER_OF_PICTURES');
        }

        for (let i = 0; i < pictureSet.pictures.length; i++) {
            if (pictureSet.pictures[i].position != i + 1) {
                throw new ExtractError(`Expected picture {i} position to follow the pattern`);
            }
        }

        return pictureSet;
    }

    pack(pictureSet: PictureSet): any {
        return PictureSetMarshaller._basicMarshaller.pack(pictureSet);
    }
}


export class CurrencyAmount {
    @MarshalWith(r.NonNegativeIntegerMarshaller)
    amount: number;

    @MarshalWith(CurrencyMarshaller)
    currency: Currency;
}


export class BankInfo {
    public static readonly MAX_NUMBER_OF_IBANS = 25;

    @MarshalWith(ArrayOf(IBANMarshaller))
    ibans: IBAN[];
}


export class BankInfoMarshaller implements Marshaller<BankInfo> {
    private static readonly _basicMarshaller = new (MarshalFrom(BankInfo))();

    extract(raw: any): BankInfo {
        const bankInfo = BankInfoMarshaller._basicMarshaller.extract(raw);

        if (bankInfo.ibans.length > BankInfo.MAX_NUMBER_OF_IBANS) {
            throw new ExtractError('Expected less than MAX_NUMBER_OF_IBANS');
        }

        return bankInfo;
    }

    pack(bankInfo: BankInfo): any {
        return BankInfoMarshaller._basicMarshaller.pack(bankInfo);
    }
}


export class CauseSummary {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(r.SlugMarshaller)
    slug: string;

    @MarshalWith(r.TimeMarshaller)
    timeLastUpdated: Date;
}


export class Cause {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(MarshalEnum(CauseState))
    state: CauseState;

    @MarshalWith(r.SlugMarshaller)
    slug: string;

    @MarshalWith(TitleMarshaller)
    title: string;

    @MarshalWith(DescriptionMarshaller)
    description: string;

    @MarshalWith(PictureSetMarshaller)
    pictureSet: PictureSet;

    @MarshalWith(r.TimeMarshaller)
    deadline: Date;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    goal: CurrencyAmount;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(r.TimeMarshaller)
    timeLastUpdated: Date;
}


export class PublicCause extends Cause {
}


export class PrivateCause extends Cause {
    @MarshalWith(BankInfoMarshaller)
    bankInfo: BankInfo;
}


export class CauseAnalytics {
    @MarshalWith(r.NonNegativeIntegerMarshaller)
    daysLeft: number;

    @MarshalWith(r.NonNegativeIntegerMarshaller)
    donorsCount: number;

    @MarshalWith(r.NonNegativeIntegerMarshaller)
    donationsCount: number;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amountDonated: CurrencyAmount;

    @MarshalWith(r.NonNegativeIntegerMarshaller)
    sharersCount: number;

    @MarshalWith(r.NonNegativeIntegerMarshaller)
    sharesCount: number;

    @MarshalWith(r.NonNegativeIntegerMarshaller)
    sharesReach: number;
}


export class DonationForCause {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;

    @MarshalWith(MarshalFrom(Session))
    fromSession: Session;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;
}


export class DonationForSession {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;

    @MarshalWith(MarshalFrom(PublicCause))
    forCause: PublicCause;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;
}


export class ShareForCause {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(FacebookPostIdMarshaller)
    facebookPostId: string;

    @MarshalWith(MarshalFrom(Session))
    fromSession: Session;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;
}


export class ShareForSession {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(MarshalFrom(PublicCause))
    forCause: PublicCause;

    @MarshalWith(FacebookPostIdMarshaller)
    facebookPostId: string;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;
}


export class UserActionsOverview {
    @MarshalWith(r.NonNegativeIntegerMarshaller)
    donationsCount: number;

    @MarshalWith(ArrayOf(MarshalFrom(CurrencyAmount)))
    amountsDonatedByCurrency: CurrencyAmount[];

    @MarshalWith(r.NonNegativeIntegerMarshaller)
    sharesCount: number;

    @MarshalWith(ArrayOf(MarshalFrom(DonationForSession)))
    latestDonations: DonationForSession[];

    @MarshalWith(ArrayOf(MarshalFrom(ShareForSession)))
    latestShares: ShareForSession[];
}
