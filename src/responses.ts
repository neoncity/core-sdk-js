import * as r from 'raynor'
import { ArrayOf, ExtractError, Marshaller, MarshalFrom, MarshalWith, ObjectMarshaller, OptionalOf } from 'raynor'

import { CauseAnalytics, DonationForUser, PrivateCause, PublicCause, ShareForUser, UserActionsOverview } from './entities'
import { CauseEvent } from './events'


export class PublicCausesResponse {
    @MarshalWith(ArrayOf(MarshalFrom(PublicCause)))
    causes: PublicCause[];
}


export class PublicCauseResponse {
    @MarshalWith(MarshalFrom(PublicCause))
    cause: PublicCause;
}


export class PrivateCauseResponse {
    @MarshalWith(r.BooleanMarshaller)
    causeIsRemoved: boolean;
    
    @MarshalWith(OptionalOf(MarshalFrom(PrivateCause)))
    cause: PrivateCause|null;
}


// Should be extends MarshalFrom(PrivateCauseResponse). Typescript doesn't yet support that.
export class PrivateCauseResponseMarshaller implements Marshaller<PrivateCauseResponse> {
    private static readonly _basicMarshaller: ObjectMarshaller<PrivateCauseResponse> = new (MarshalFrom(PrivateCauseResponse))();

    extract(raw: any): PrivateCauseResponse {
	const response = PrivateCauseResponseMarshaller._basicMarshaller.extract(raw);
	
	if (response.causeIsRemoved && response.cause != null) {
	    throw new ExtractError('Expected no cause when it is removed');
	}

	if (!response.causeIsRemoved && response.cause == null) {
	    throw new ExtractError('Expected a cause when it is not removed');
	}
	
	return response;
    }

    pack(response: PrivateCauseResponse): any {
	return PrivateCauseResponseMarshaller._basicMarshaller.pack(response);
    }
}


export class UserDonationResponse {
    @MarshalWith(MarshalFrom(DonationForUser))
    donation: DonationForUser;
}


export class UserShareResponse {
    @MarshalWith(MarshalFrom(ShareForUser))
    share: ShareForUser;
}


export class CauseAnalyticsResponse {
    @MarshalWith(MarshalFrom(CauseAnalytics))
    causeAnalytics: CauseAnalytics;
}


export class ActionsOverviewResponse {
    @MarshalWith(MarshalFrom(UserActionsOverview))
    actionsOverview: UserActionsOverview;
}


export class CauseEventsResponse {
    @MarshalWith(ArrayOf(MarshalFrom(CauseEvent)))
    events: CauseEvent[];
}
