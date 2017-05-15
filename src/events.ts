import * as r from 'raynor'
import { MarshalEnum, MarshalFrom, MarshalWith, OneOf2, OptionalOf } from 'raynor'

import { CreateCauseRequest, CreateDonationRequest, CreateShareRequest, UpdateCauseRequest } from './requests'


export enum CauseEventType {
    Unknown = 0,
    Created = 1,
    Updated = 2,
    Succeeded = 3,
    Removed = 4
}


export class CauseEvent {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(MarshalEnum(CauseEventType))
    type: CauseEventType;

    @MarshalWith(r.TimeMarshaller)
    timestamp: Date;

    @MarshalWith(OptionalOf(OneOf2(
        MarshalFrom(CreateCauseRequest),
        MarshalFrom(UpdateCauseRequest))))
    data: CreateCauseRequest|UpdateCauseRequest|null;
}


export enum DonationEventType {
    Unknown = 0,
    Created = 1
}


export class DonationEvent {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(MarshalEnum(DonationEventType))
    type: DonationEventType;

    @MarshalWith(r.TimeMarshaller)
    timestamp: Date;

    @MarshalWith(OptionalOf(MarshalFrom(CreateDonationRequest)))
    data: CreateDonationRequest|null;
}


export enum ShareEventType {
    Unknown = 0,
    Created = 1
}


export class ShareEvent {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(MarshalEnum(ShareEventType))
    type: ShareEventType;

    @MarshalWith(r.TimeMarshaller)
    timestamp: Date;

    @MarshalWith(OptionalOf(MarshalFrom(CreateShareRequest)))
    data: CreateShareRequest|null;
}
