import * as r from 'raynor'
import { MarshalFrom, MarshalWith, OptionalOf } from 'raynor'

import { BankInfo,
	 BankInfoMarshaller,
	 CurrencyAmount,
	 DescriptionMarshaller,
	 FacebookPostIdMarshaller,
	 PictureSet,
	 PictureSetMarshaller,
	 TitleMarshaller } from './entities'


export class CreateCauseRequest {
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

    @MarshalWith(BankInfoMarshaller)
    bankInfo: BankInfo;
}


export class UpdateCauseRequest {
    @MarshalWith(OptionalOf(TitleMarshaller))
    title: string|null;

    @MarshalWith(OptionalOf(DescriptionMarshaller))
    description: string|null;

    @MarshalWith(OptionalOf(PictureSetMarshaller))
    pictureSet: PictureSet|null;

    @MarshalWith(OptionalOf(r.TimeMarshaller))
    deadline: Date|null;

    @MarshalWith(OptionalOf(MarshalFrom(CurrencyAmount)))
    goal: CurrencyAmount|null;

    @MarshalWith(OptionalOf(BankInfoMarshaller))
    bankInfo: BankInfo|null;
}


export class CreateDonationRequest {
    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;
}


export class CreateShareRequest {
    @MarshalWith(FacebookPostIdMarshaller)
    facebookPostId: string;
}
