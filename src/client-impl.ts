import 'isomorphic-fetch'
import * as HttpStatus from 'http-status-codes'
import { Marshaller, MarshalFrom } from 'raynor'

import { isLocal, Env } from '@neoncity/common-js'
import { AuthInfo } from '@neoncity/identity-sdk-js'

import {
    CauseDeletedForUserError,
    CoreError,
    CorePrivateClient,
    CorePublicClient,
    NoCauseForUserError,
    UnauthorizedCoreError,
    UpdateCauseOptions } from './client'
import {
    BankInfo,
    CauseAnalytics,
    CurrencyAmount,
    DonationForSession,
    PictureSet,
    PrivateCause,
    PublicCause,
    ShareForSession,
    UserActionsOverview } from './entities'
import {
    CreateCauseRequest,
    CreateDonationRequest,
    CreateShareRequest,
    UpdateCauseRequest } from './requests'
import {
    CauseAnalyticsResponse,
    PrivateCauseResponse,
    PrivateCauseResponseMarshaller,
    PublicCausesResponse,
    PublicCauseResponse,
    SessionDonationResponse,
    SessionShareResponse,
    UserActionsOverviewResponse } from './responses'



export function newCorePublicClient(env: Env, coreServiceHost: string): CorePublicClient {
    const authInfoMarshaller = new (MarshalFrom(AuthInfo))();
    const createDonationRequestMarshaller = new (MarshalFrom(CreateDonationRequest));
    const createShareRequestMarshaller = new (MarshalFrom(CreateShareRequest));
    const publicCausesResponseMarshaller = new (MarshalFrom(PublicCausesResponse));
    const publicCauseResponseMarshaller = new (MarshalFrom(PublicCauseResponse));
    const sessionDonationResponseMarshaller = new (MarshalFrom(SessionDonationResponse));
    const sessionShareResponseMarshaller = new (MarshalFrom(SessionShareResponse));
    
    return new CorePublicClientImpl(
	env,
        coreServiceHost,
        authInfoMarshaller,
	createDonationRequestMarshaller,
	createShareRequestMarshaller,
        publicCausesResponseMarshaller,
	publicCauseResponseMarshaller,
	sessionDonationResponseMarshaller,
	sessionShareResponseMarshaller);
}


class CorePublicClientImpl {
    private static readonly _getCausesOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client',
	credentials: 'include'
    };

    private static readonly _getCauseOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client',
	credentials: 'include'
    };

    private static readonly _createDonationOptions: RequestInit = {
	method: 'POST',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client',
	credentials: 'include'	
    };

    private static readonly _createShareOptions: RequestInit = {
	method: 'POST',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client',
	credentials: 'include'	
    };

    private readonly _env: Env;
    private readonly _coreServiceHost: string;
    private readonly _authInfoMarshaller: Marshaller<AuthInfo>;
    private readonly _createDonationRequestMarshaller: Marshaller<CreateDonationRequest>;
    private readonly _createShareRequestMarshaller: Marshaller<CreateShareRequest>;
    private readonly _publicCausesResponseMarshaller: Marshaller<PublicCausesResponse>;
    private readonly _publicCauseResponseMarshaller: Marshaller<PublicCauseResponse>;
    private readonly _sessionDonationResponseMarshaller: Marshaller<SessionDonationResponse>;
    private readonly _sessionShareResponseMarshaller: Marshaller<SessionShareResponse>;
    private readonly _authInfo: AuthInfo|null;
    private readonly _protocol: string;
    
    constructor(
	env: Env,
	coreServiceHost: string,
	authInfoMarshaller: Marshaller<AuthInfo>,
	createDonationRequestMarshaller: Marshaller<CreateDonationRequest>,
	createShareRequestMarshaller: Marshaller<CreateShareRequest>,
        publicCausesResponseMarshaller: Marshaller<PublicCausesResponse>,
	publicCauseResponseMarshaller: Marshaller<PublicCauseResponse>,
	sessionDonationResponseMarshaller: Marshaller<SessionDonationResponse>,
	sessionShareResponseMarshaller: Marshaller<SessionShareResponse>,
	authInfo: AuthInfo|null = null) {
	this._env = env;
	this._coreServiceHost = coreServiceHost;
	this._authInfoMarshaller = authInfoMarshaller;
	this._createDonationRequestMarshaller = createDonationRequestMarshaller;
	this._createShareRequestMarshaller = createShareRequestMarshaller;
        this._publicCausesResponseMarshaller = publicCausesResponseMarshaller;
	this._publicCauseResponseMarshaller = publicCauseResponseMarshaller;
	this._sessionDonationResponseMarshaller = sessionDonationResponseMarshaller;
	this._sessionShareResponseMarshaller = sessionShareResponseMarshaller;
	this._authInfo = authInfo;

	if (isLocal(this._env)) {
	    this._protocol = 'http';
	} else {
	    this._protocol = 'https';
	}	
    }

    withAuthInfo(authInfo: AuthInfo): CorePublicClient {
	return new CorePublicClientImpl(
	    this._env,
	    this._coreServiceHost,
	    this._authInfoMarshaller,
	    this._createDonationRequestMarshaller,
	    this._createShareRequestMarshaller,
	    this._publicCausesResponseMarshaller,
	    this._publicCauseResponseMarshaller,
	    this._sessionDonationResponseMarshaller,
	    this._sessionShareResponseMarshaller,
	    authInfo);
    }
    
    async getCauses(): Promise<PublicCause[]> {
	const options = (Object as any).assign({}, CorePublicClientImpl._getCausesOptions);

	if (this._authInfo != null) {
	    options.headers = {[AuthInfo.HeaderName]: JSON.stringify(this._authInfoMarshaller.pack(this._authInfo))};
	}

        let rawResponse: Response;
        try {
            rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/public/causes`, options);
        } catch (e) {
            throw new CoreError(`Could not retrieve causes - request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const publicCausesResponse = this._publicCausesResponseMarshaller.extract(jsonResponse);

                return publicCausesResponse.causes;
            } catch (e) {
                throw new CoreError(`Could not retrieve causes - '${e.toString()}'`);
            }
        } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else {
            throw new CoreError(`Could not retrieve causes - service response ${rawResponse.status}`);
        }	
    }

    async getCause(causeId: number): Promise<PublicCause> {
	const options = (Object as any).assign({}, CorePublicClientImpl._getCauseOptions);

	if (this._authInfo != null) {
	    options.headers = {[AuthInfo.HeaderName]: JSON.stringify(this._authInfoMarshaller.pack(this._authInfo))};
	}

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/public/causes/${causeId}`, options);
	} catch (e) {
	    throw new CoreError(`Could not retrieve cause ${causeId} - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const publicCauseResponse = this._publicCauseResponseMarshaller.extract(jsonResponse);

		return publicCauseResponse.cause;
	    } catch (e) {
		throw new CoreError(`Could not retrieve cause ${causeId} - '${e.toString()}'`);
	    }
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else {
	    throw new CoreError(`Could not retrieve cause ${causeId} - service response ${rawResponse.status}`);
	}
    }

    async createDonation(causeId: number, amount: CurrencyAmount): Promise<DonationForSession> {
	const createDonationRequest = new CreateDonationRequest();
	createDonationRequest.amount = amount;

        const options = (Object as any).assign({}, CorePublicClientImpl._createDonationOptions, {
	    headers: {'Content-Type': 'application/json'},
	    body: JSON.stringify(this._createDonationRequestMarshaller.pack(createDonationRequest))
	});

	if (this._authInfo != null) {
	    options.headers[AuthInfo.HeaderName] = JSON.stringify(this._authInfoMarshaller.pack(this._authInfo));
	}

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/public/causes/${causeId}/donations`, options);
	} catch (e) {
	    throw new CoreError(`Could not create donation for cause ${causeId} - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const sessionDonationResponse = this._sessionDonationResponseMarshaller.extract(jsonResponse);

		return sessionDonationResponse.donation;
	    } catch (e) {
		throw new CoreError(`Chould not create donation for cause ${causeId} - '${e.toString()}'`);
	    }
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else {
	    throw new CoreError(`Could not create donation for cause ${causeId} - service response ${rawResponse.status}`);
	}	
    }

    async createShare(causeId: number, facebookPostId: string): Promise<ShareForSession> {
	const createShareRequest = new CreateShareRequest();
        createShareRequest.facebookPostId = facebookPostId;

        const options = (Object as any).assign({}, CorePublicClientImpl._createShareOptions, {
	    headers: {'Content-Type': 'application/json'},
	    body: JSON.stringify(this._createShareRequestMarshaller.pack(createShareRequest))
	});

	if (this._authInfo != null) {
	    options.headers[AuthInfo.HeaderName] = JSON.stringify(this._authInfoMarshaller.pack(this._authInfo));
	}

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/public/causes/${causeId}/shares`, options);
	} catch (e) {
	    throw new CoreError(`Could not create share for cause ${causeId} - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const sessionShareResponse = this._sessionShareResponseMarshaller.extract(jsonResponse);

		return sessionShareResponse.share;
	    } catch (e) {
		throw new CoreError(`Chould not create share for cause ${causeId} - '${e.toString()}'`);
	    }
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else {
	    throw new CoreError(`Could not create share for cause ${causeId} - service response ${rawResponse.status}`);
	}	
    }
}


export function newCorePrivateClient(env: Env, coreServiceHost: string): CorePrivateClient {
    const authInfoMarshaller = new (MarshalFrom(AuthInfo))();
    const createCauseRequestMarshaller = new (MarshalFrom(CreateCauseRequest))();
    const updateCauseRequestMarshaller = new (MarshalFrom(UpdateCauseRequest))();
    const privateCauseResponseMarshaller = new PrivateCauseResponseMarshaller();
    const causeAnalyticsResponseMarshaller = new (MarshalFrom(CauseAnalyticsResponse))();
    const userActionsOverviewResponseMarshaller = new (MarshalFrom(UserActionsOverviewResponse))();
    
    return new CorePrivateClientImpl(
	env,
        coreServiceHost,
        authInfoMarshaller,
	createCauseRequestMarshaller,
	updateCauseRequestMarshaller,
	privateCauseResponseMarshaller,
	causeAnalyticsResponseMarshaller,
	userActionsOverviewResponseMarshaller);
}


class CorePrivateClientImpl {
    private static readonly _createCauseOptions: RequestInit = {
	method: 'POST',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client',
	credentials: 'include'
    };

    private static readonly _getCauseOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client',
	credentials: 'include'
    };

    private static readonly _updateCauseOptions: RequestInit = {
	method: 'PUT',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client',
	credentials: 'include'
    };    

    private static readonly _deleteCauseOptions: RequestInit = {
	method: 'DELETE',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client',
	credentials: 'include'
    };

    private static readonly _getCauseAnalyticsOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client',
	credentials: 'include'
    };

    private static readonly _getUserActionsOverviewOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client',
	credentials: 'include'
    };    

    private readonly _env: Env;
    private readonly _coreServiceHost: string;
    private readonly _authInfoMarshaller: Marshaller<AuthInfo>;
    private readonly _createCauseRequestMarshaller: Marshaller<CreateCauseRequest>;
    private readonly _updateCauseRequestMarshaller: Marshaller<UpdateCauseRequest>;
    private readonly _privateCauseResponseMarshaller: Marshaller<PrivateCauseResponse>;
    private readonly _causeAnalyticsResponseMarshaller: Marshaller<CauseAnalyticsResponse>;
    private readonly _userActionsOverviewResponseMarshaller: Marshaller<UserActionsOverviewResponse>;
    private readonly _authInfo: AuthInfo|null;
    private readonly _protocol: string;

    constructor(
	env: Env,
        coreServiceHost: string,
        authInfoMarshaller: Marshaller<AuthInfo>,
	createCauseRequestMarshaller: Marshaller<CreateCauseRequest>,
	updateCauseRequestMarshaller: Marshaller<UpdateCauseRequest>,
	privateCauseResponseMarshaller: Marshaller<PrivateCauseResponse>,
	causeAnalyticsResponseMarshaller: Marshaller<CauseAnalyticsResponse>,
	userActionsOverviewResponseMarshaller: Marshaller<UserActionsOverviewResponse>,
	authInfo: AuthInfo|null = null) {
	this._env = env;
        this._coreServiceHost = coreServiceHost;
        this._authInfoMarshaller = authInfoMarshaller;
	this._createCauseRequestMarshaller = createCauseRequestMarshaller;
	this._updateCauseRequestMarshaller = updateCauseRequestMarshaller;
	this._privateCauseResponseMarshaller = privateCauseResponseMarshaller;
	this._causeAnalyticsResponseMarshaller = causeAnalyticsResponseMarshaller;
	this._userActionsOverviewResponseMarshaller = userActionsOverviewResponseMarshaller;
	this._authInfo = authInfo;

	if (isLocal(this._env)) {
	    this._protocol = 'http';
	} else {
	    this._protocol = 'https';
	}	
    }

    withAuthInfo(authInfo: AuthInfo): CorePrivateClient {
	return new CorePrivateClientImpl(
	    this._env,
	    this._coreServiceHost,
	    this._authInfoMarshaller,
	    this._createCauseRequestMarshaller,
	    this._updateCauseRequestMarshaller,
	    this._privateCauseResponseMarshaller,
	    this._causeAnalyticsResponseMarshaller,
	    this._userActionsOverviewResponseMarshaller,
	    authInfo);
    }

    async createCause(title: string, description: string, pictureSet: PictureSet, deadline: Date, goal: CurrencyAmount, bankInfo: BankInfo): Promise<PrivateCause> {
	const createCauseRequest = new CreateCauseRequest();
	createCauseRequest.title = title;
	createCauseRequest.description = description;
	createCauseRequest.pictureSet = pictureSet;
	createCauseRequest.deadline = deadline;
	createCauseRequest.goal = goal;
	createCauseRequest.bankInfo = bankInfo;

        const options = (Object as any).assign({}, CorePrivateClientImpl._createCauseOptions, {
	    headers: {'Content-Type': 'application/json'},
	    body: JSON.stringify(this._createCauseRequestMarshaller.pack(createCauseRequest))
	});

	if (this._authInfo != null) {
	    options.headers[AuthInfo.HeaderName] = JSON.stringify(this._authInfoMarshaller.pack(this._authInfo));
	}

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/private/causes`, options);
	} catch (e) {
	    throw new CoreError(`Could not create cause - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    let privateCauseResponse = null;
	    try {
		const jsonResponse = await rawResponse.json();
		privateCauseResponse = this._privateCauseResponseMarshaller.extract(jsonResponse);
	    } catch (e) {
		throw new CoreError(`Chould not retrieve cause - '${e.toString()}'`);
	    }

	    if (privateCauseResponse.causeIsRemoved) {
		throw new Error('Should not happen');
	    }

	    return privateCauseResponse.cause as PrivateCause;
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else {
	    throw new CoreError(`Could not retrieve cause - service response ${rawResponse.status}`);
	}
    }

    async getCause(): Promise<PrivateCause> {
	const options = (Object as any).assign({}, CorePrivateClientImpl._getCauseOptions);

	if (this._authInfo != null) {
	    options.headers = {[AuthInfo.HeaderName]: JSON.stringify(this._authInfoMarshaller.pack(this._authInfo))};
	}

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/private/causes`, options);
	} catch (e) {
	    throw new CoreError(`Could not retrieve cause - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    let privateCauseResponse = null;
	    try {
		const jsonResponse = await rawResponse.json();
		privateCauseResponse = this._privateCauseResponseMarshaller.extract(jsonResponse);
	    } catch (e) {
		throw new CoreError(`Could not retrieve cause - '${e.toString()}'`);
	    }		

            if (privateCauseResponse.causeIsRemoved) {
	        throw new CauseDeletedForUserError('Cause already deleted');
	    }

	    return privateCauseResponse.cause as PrivateCause;
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
        } else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new NoCauseForUserError('User does not have a cause');
	} else {
	    throw new CoreError(`Could not retrieve cause - service response ${rawResponse.status}`);
	}
    }

    async updateCause(updateOptions: UpdateCauseOptions): Promise<PrivateCause> {
	const updateCauseRequest = new UpdateCauseRequest();

	// Hackety-hack-hack.
	for (let key in updateOptions) {
	    (updateCauseRequest as any)[key] = (updateOptions as any)[key];
	}

	const options = (Object as any).assign({}, CorePrivateClientImpl._updateCauseOptions, {
	    headers: {'Content-Type': 'application/json'},
	    body: JSON.stringify(this._updateCauseRequestMarshaller.pack(updateCauseRequest))
	});

	if (this._authInfo != null) {
	    options.headers[AuthInfo.HeaderName] = JSON.stringify(this._authInfoMarshaller.pack(this._authInfo));
	}	

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/private/causes`, options);
	} catch (e) {
	    throw new CoreError(`Could not update cause - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    let privateCauseResponse = null;
	    try {
		const jsonResponse = await rawResponse.json();
		privateCauseResponse = this._privateCauseResponseMarshaller.extract(jsonResponse);
	    } catch (e) {
		throw new CoreError(`Chould not update cause - '${e.toString()}'`);
	    }
	    
	    if (privateCauseResponse.causeIsRemoved) {
		throw new CauseDeletedForUserError('Cause already deleted');
	    }

	    return privateCauseResponse.cause as PrivateCause;
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new NoCauseForUserError('User does not have a cause');
	} else {
	    throw new CoreError(`Could not update cause - service response ${rawResponse.status}`);
	}
    }

    async deleteCause(): Promise<void> {
	const options = (Object as any).assign({}, CorePrivateClientImpl._deleteCauseOptions);

	if (this._authInfo != null) {
	    options.headers = {[AuthInfo.HeaderName]: JSON.stringify(this._authInfoMarshaller.pack(this._authInfo))};
	}

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/private/causes`, options);
	} catch (e) {
	    throw new CoreError(`Could not delete cause - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    // Do nothing
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new NoCauseForUserError('User does not have a cause');
	} else {
	    throw new CoreError(`Could not delete cause - service response ${rawResponse.status}`);
	} 
    }

    async getCauseAnalytics(): Promise<CauseAnalytics> {
	const options = (Object as any).assign({}, CorePrivateClientImpl._getCauseAnalyticsOptions);

	if (this._authInfo != null) {
	    options.headers = {[AuthInfo.HeaderName]: JSON.stringify(this._authInfoMarshaller.pack(this._authInfo))};
	}

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/private/causes/analytics`, options);
	} catch (e) {
	    throw new CoreError(`Could not retrieve cause analytics - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const causeAnalyticsResponse = this._causeAnalyticsResponseMarshaller.extract(jsonResponse);

		return causeAnalyticsResponse.causeAnalytics;
	    } catch (e) {
		throw new CoreError(`Could not retrieve cause analytics - '${e.toString()}'`);
	    }
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new NoCauseForUserError('User does not have a cause');
	} else {
	    throw new CoreError(`Could not retrieve cause analytics - service response ${rawResponse.status}`);
	}	
    }    

    async getUserActionsOverview(): Promise<UserActionsOverview> {
	const options = (Object as any).assign({}, CorePrivateClientImpl._getUserActionsOverviewOptions);

	if (this._authInfo != null) {
	    options.headers = {[AuthInfo.HeaderName]: JSON.stringify(this._authInfoMarshaller.pack(this._authInfo))};
	}

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/private/user-actions-overview`, options);
	} catch (e) {
	    throw new CoreError(`Could not retrieve actions overview - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const userActionsOverviewResponse = this._userActionsOverviewResponseMarshaller.extract(jsonResponse);

		return userActionsOverviewResponse.userActionsOverview;
	    } catch (e) {
		throw new CoreError(`Could not retrieve actions overview - '${e.toString()}'`);
	    }
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else {
	    throw new CoreError(`Could not retrieve actions overview - service response ${rawResponse.status}`);
	}	
    }
}
