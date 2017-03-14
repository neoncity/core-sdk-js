export const FOO: string = 'bar';

import * as m from '@neoncity/common-js/marshall'
import { ArrayOf, ExtractError, Marshaller, MarshalEnum, MarshalFrom, MarshalWith, OptionalOf } from '@neoncity/common-js/marshall'
import { AuthInfo, User } from '@neoncity/identity-sdk-js'


export enum CauseState {
    Unknown = 0,
    Active = 1,
    Succeeded = 2,
    Removed = 3
}


class TitleMarshaller extends m.MaxLengthStringMarshaller {
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


class DescriptionMarshaller extends m.MaxLengthStringMarshaller {
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


export class Picture {
    @MarshalWith(m.PositiveIntegerMarshaller)
    position: number;
    
    @MarshalWith(m.UriMarshaller)
    uri: string;

    @MarshalWith(m.PositiveIntegerMarshaller)
    width: number;

    @MarshalWith(m.PositiveIntegerMarshaller)
    height: number;
}


export class CurrencyAmount {
    @MarshalWith(m.PositiveIntegerMarshaller)
    amount: number;

    @MarshalWith(m.StringMarshaller)
    currency: string;
}


export class BankInfo {
    @MarshalWith(ArrayOf(m.StringMarshaller))
    ibans: string[];
}


export class Cause {
    @MarshalWith(m.IdMarshaller)
    id: number;

    @MarshalWith(MarshalEnum(CauseState))
    state: CauseState;

    @MarshalWith(m.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(m.TimeMarshaller)
    timeLastUpdated: Date;

    @MarshalWith(TitleMarshaller)
    title: string;

    @MarshalWith(DescriptionMarshaller)
    description: string;

    @MarshalWith(ArrayOf(MarshalFrom(Picture)))
    pictures: Picture[];

    @MarshalWith(m.TimeMarshaller)
    deadline: Date;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    goal: CurrencyAmount;

    @MarshalWith(MarshalFrom(BankInfo))
    bankInfo: BankInfo;
}


export class DonationForCause {
    @MarshalWith(m.IdMarshaller)
    id: number;

    @MarshalWith(m.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(MarshalFrom(User))
    fromUser: User;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;
}


export class DonationForUser {
    @MarshalWith(m.IdMarshaller)
    id: number;

    @MarshalWith(m.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(MarshalFrom(Cause))
    forCause: Cause;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;
}


export class ShareForCause {
    @MarshalWith(m.IdMarshaller)
    id: number;

    @MarshalWith(m.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(MarshalFrom(User))
    fromUser: User;
}


export class ShareForUser {
    @MarshalWith(m.IdMarshaller)
    id: number;

    @MarshalWith(m.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(MarshalFrom(Cause))
    forCause: Cause;
}


export class CausesResponse {
    @MarshalWith(ArrayOf(MarshalFrom(Cause)))
    causes: Cause[];
}


export class CauseResponse {
    @MarshalWith(MarshalFrom(Cause))
    cause: Cause;
}


export class CauseDonationResponse {
    @MarshalWith(MarshalFrom(DonationForCause))
    donation: DonationForCause;
}


export class CauseShareResponse {
    @MarshalWith(MarshalFrom(ShareForCause))
    share: ShareForCause;
}


export class CreateCauseRequest {
    @MarshalWith(TitleMarshaller)
    title: string;

    @MarshalWith(DescriptionMarshaller)
    description: string;

    @MarshalWith(ArrayOf(MarshalFrom(Picture)))
    pictures: Picture[];

    @MarshalWith(m.TimeMarshaller)
    deadline: Date;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    goal: CurrencyAmount;

    @MarshalWith(MarshalFrom(BankInfo))
    bankInfo: BankInfo;
}


export class UpdateCauseRequest {
    @MarshalWith(OptionalOf(TitleMarshaller))
    title: string|null;

    @MarshalWith(OptionalOf(DescriptionMarshaller))
    description: string|null;

    @MarshalWith(OptionalOf(ArrayOf(MarshalFrom(Picture))))
    pictures: Picture[]|null;

    @MarshalWith(OptionalOf(m.TimeMarshaller))
    deadline: Date|null;

    @MarshalWith(OptionalOf(MarshalFrom(CurrencyAmount)))
    goal: CurrencyAmount|null;

    @MarshalWith(OptionalOf(MarshalFrom(BankInfo)))
    bankInfo: BankInfo|null;
}


export class CreateDonationRequest {
    @MarshalWith(m.IdMarshaller)
    causeId: number;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;
}


export class CreateShareRequest {
    @MarshalWith(m.IdMarshaller)
    causeId: number;
}


export class CoreError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CoreError';
    }
}


export function newCoreService(auth0AccessToken: string, coreServiceHost: string) {
    const authInfoMarshaller = new (MarshalFrom(AuthInfo))();
    const causesResponseMarshaller = new (MarshalFrom(CausesResponse));
    
    return new CoreService(
        auth0AccessToken,
        coreServiceHost,
        authInfoMarshaller,
        causesResponseMarshaller);
}


export class CoreService {
    private static readonly _getCausesOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };
    
    private readonly _auth0AccessToken: string;
    private readonly _coreServiceHost: string;
    private readonly _authInfoMarshaller: Marshaller<AuthInfo>;
    private readonly _causesResponseMarshaller: Marshaller<CausesResponse>;

    constructor(
        auth0AccessToken: string,
        coreServiceHost: string,
        authInfoMarshaller: Marshaller<AuthInfo>,
        causesResponseMarshaller: Marshaller<CausesResponse>) {
        this._auth0AccessToken = auth0AccessToken;
        this._coreServiceHost = coreServiceHost;
        this._authInfoMarshaller = authInfoMarshaller;
        this._causesResponseMarshaller = causesResponseMarshaller;
    }

    async getCauses(): Promise<Cause[]> {
	const authInfo = new AuthInfo(this._auth0AccessToken);
	const authInfoSerialized = JSON.stringify(this._authInfoMarshaller.pack(authInfo));
        const options = (Object as any).assign({}, CoreService._getCausesOptions, {headers: {'X-NeonCity-AuthInfo': authInfoSerialized}});

        let rawResponse: Response;
        try {
            rawResponse = await fetch("http://${this._coreServiceHost}/causes", options);
        } catch (e) {
            throw new CoreError("Could not retrieve causes - request failed because '${e.toString()}'");
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const causesResponse = this._causesResponseMarshaller.extract(jsonResponse);

                return causesResponse.causes;
            } catch (e) {
                throw new CoreError("Could not retrieve causes '${e.toString()}'");
            }
        } else {
            throw new CoreError("Could not retrieve causes - service response ${rawResponse.status}");
        }
    }

    async createCause(title: string, description: string, pictures: Picture[], deadline: Date, goal: CurrencyAmount, bankInfo: BankInfo): Promise<Cause> {
    }

    async getCause(causeId: number): Promise<Cause> {
    }

    async updateCause(causeId: number): Promise<Cause> {
    }

    async deleteCause(causeId: number): Promise<null> {
    }

    async makeDonation(causeId: number): Promise<DonationForUser> {
    }

    async share(causeId: number): Promise<ShareForUser> {
    }
}
