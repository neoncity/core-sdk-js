import * as HttpStatus from 'http-status-codes'
import { Marshaller, MarshalFrom } from 'raynor'

import { isLocal, Env } from '@neoncity/common-js'
import { AuthInfo } from '@neoncity/identity-sdk-js'

import { CreateCauseRequest, CreateDonationRequest, CreateShareRequest, UpdateCauseRequest } from './requests'
import { ActionsOverviewResponse,
	 CauseAnalyticsResponse,
	 PrivateCauseResponse,
	 PrivateCauseResponseMarshaller,
	 PublicCausesResponse,
	 PublicCauseResponse,
	 UserDonationResponse,
	 UserShareResponse } from './responses'
import { BankInfo,
	 CauseAnalytics,
	 CurrencyAmount,
	 DonationForUser,
	 PictureSet,
	 PrivateCause,
	 PublicCause,
	 ShareForUser,
	 UserActionsOverview } from './entities'


export class CoreError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CoreError';
    }
}


export class UnauthorizedCoreError extends CoreError {
    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedCoreError';
    }
}


export class CauseDeletedForUserError extends CoreError {
    constructor(message: string) {
	super(message);
	this.name = 'CauseDeletedForUserError';
    }
}


export class NoCauseForUserError extends CoreError {
    constructor(message: string) {
        super(message);
        this.name = 'NoCauseForUserError';
    }
}


export interface UpdateCauseOptions {
    title?: string;
    description?: string;
    pictureSet?: PictureSet;
    deadline?: Date;
    goal?: CurrencyAmount;
    bankInfo?: BankInfo;
}


export function newCorePublicClient(env: Env, coreServiceHost: string) {
    const authInfoMarshaller = new (MarshalFrom(AuthInfo))();
    const createDonationRequestMarshaller = new (MarshalFrom(CreateDonationRequest));
    const createShareRequestMarshaller = new (MarshalFrom(CreateShareRequest));
    const publicCausesResponseMarshaller = new (MarshalFrom(PublicCausesResponse));
    const publicCauseResponseMarshaller = new (MarshalFrom(PublicCauseResponse));
    const userDonationResponseMarshaller = new (MarshalFrom(UserDonationResponse));
    const userShareResponseMarshaller = new (MarshalFrom(UserShareResponse));
    
    return new CorePublicClient(
	env,
        coreServiceHost,
        authInfoMarshaller,
	createDonationRequestMarshaller,
	createShareRequestMarshaller,
        publicCausesResponseMarshaller,
	publicCauseResponseMarshaller,
	userDonationResponseMarshaller,
	userShareResponseMarshaller);
}


export class CorePublicClient {
    private static readonly _getCausesOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };

    private static readonly _getCauseOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };

    private static readonly _createDonationOptions: RequestInit = {
	method: 'POST',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'	
    };

    private static readonly _createShareOptions: RequestInit = {
	method: 'POST',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'	
    };

    private readonly _env: Env;
    private readonly _coreServiceHost: string;
    private readonly _authInfoMarshaller: Marshaller<AuthInfo>;
    private readonly _createDonationRequestMarshaller: Marshaller<CreateDonationRequest>;
    private readonly _createShareRequestMarshaller: Marshaller<CreateShareRequest>;
    private readonly _publicCausesResponseMarshaller: Marshaller<PublicCausesResponse>;
    private readonly _publicCauseResponseMarshaller: Marshaller<PublicCauseResponse>;
    private readonly _userDonationResponseMarshaller: Marshaller<UserDonationResponse>;
    private readonly _userShareResponseMarshaller: Marshaller<UserShareResponse>;
    private readonly _protocol: string;
    
    constructor(
	env: Env,
	coreServiceHost: string,
	authInfoMarshaller: Marshaller<AuthInfo>,
	createDonationRequestMarshaller: Marshaller<CreateDonationRequest>,
	createShareRequestMarshaller: Marshaller<CreateShareRequest>,
        publicCausesResponseMarshaller: Marshaller<PublicCausesResponse>,
	publicCauseResponseMarshaller: Marshaller<PublicCauseResponse>,
	userDonationResponseMarshaller: Marshaller<UserDonationResponse>,
	userShareResponseMarshaller: Marshaller<UserShareResponse>) {
	this._env = env;
	this._coreServiceHost = coreServiceHost;
	this._authInfoMarshaller = authInfoMarshaller;
	this._createDonationRequestMarshaller = createDonationRequestMarshaller;
	this._createShareRequestMarshaller = createShareRequestMarshaller;
        this._publicCausesResponseMarshaller = publicCausesResponseMarshaller;
	this._publicCauseResponseMarshaller = publicCauseResponseMarshaller;
	this._userDonationResponseMarshaller = userDonationResponseMarshaller;
	this._userShareResponseMarshaller = userShareResponseMarshaller;

	if (isLocal(this._env)) {
	    this._protocol = 'http';
	} else {
	    this._protocol = 'https';
	}	
    }
    
    async getCauses(sessionId: string, auth0AccessToken: string|null): Promise<PublicCause[]> {
	const authInfo = new AuthInfo(sessionId, auth0AccessToken);

	const options = (Object as any).assign({}, CorePublicClient._getCausesOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

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

    async getCause(sessionId: string, auth0AccessToken: string|null, causeId: number): Promise<PublicCause> {
	const authInfo = new AuthInfo(sessionId, auth0AccessToken);
	const options = (Object as any).assign({}, CorePublicClient._getCauseOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

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

    async createDonation(sessionId: string, auth0AccessToken: string, causeId: number, amount: CurrencyAmount): Promise<DonationForUser> {
	const authInfo = new AuthInfo(sessionId, auth0AccessToken);
	const createDonationRequest = new CreateDonationRequest();
	createDonationRequest.amount = amount;

        const options = (Object as any).assign({}, CorePublicClient._createDonationOptions, {
	    headers: {
		'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo)),
		'Content-Type': 'application/json'
	    },
	    body: JSON.stringify(this._createDonationRequestMarshaller.pack(createDonationRequest))
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/public/causes/${causeId}/donations`, options);
	} catch (e) {
	    throw new CoreError(`Could not create donation for cause ${causeId} - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const userDonationResponse = this._userDonationResponseMarshaller.extract(jsonResponse);

		return userDonationResponse.donation;
	    } catch (e) {
		throw new CoreError(`Chould not create donation for cause ${causeId} - '${e.toString()}'`);
	    }
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else {
	    throw new CoreError(`Could not create donation for cause ${causeId} - service response ${rawResponse.status}`);
	}	
    }

    async createShare(sessionId: string, auth0AccessToken: string, causeId: number, facebookPostId: string): Promise<ShareForUser> {
	const authInfo = new AuthInfo(sessionId, auth0AccessToken);
	const createShareRequest = new CreateShareRequest();
        createShareRequest.facebookPostId = facebookPostId;

        const options = (Object as any).assign({}, CorePublicClient._createShareOptions, {
	    headers: {
		'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo)),
		'Content-Type': 'application/json'
	    },
	    body: JSON.stringify(this._createShareRequestMarshaller.pack(createShareRequest))
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/public/causes/${causeId}/shares`, options);
	} catch (e) {
	    throw new CoreError(`Could not create share for cause ${causeId} - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const userShareResponse = this._userShareResponseMarshaller.extract(jsonResponse);

		return userShareResponse.share;
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


export function newCorePrivateClient(env: Env, coreServiceHost: string) {
    const authInfoMarshaller = new (MarshalFrom(AuthInfo))();
    const createCauseRequestMarshaller = new (MarshalFrom(CreateCauseRequest))();
    const updateCauseRequestMarshaller = new (MarshalFrom(UpdateCauseRequest))();
    const privateCauseResponseMarshaller = new PrivateCauseResponseMarshaller();
    const causeAnalyticsResponseMarshaller = new (MarshalFrom(CauseAnalyticsResponse))();
    const actionsOverviewResponseMarshaller = new (MarshalFrom(ActionsOverviewResponse))();
    
    return new CorePrivateClient(
	env,
        coreServiceHost,
        authInfoMarshaller,
	createCauseRequestMarshaller,
	updateCauseRequestMarshaller,
	privateCauseResponseMarshaller,
	causeAnalyticsResponseMarshaller,
	actionsOverviewResponseMarshaller);
}


export class CorePrivateClient {
    private static readonly _createCauseOptions: RequestInit = {
	method: 'POST',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };

    private static readonly _getCauseOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };

    private static readonly _updateCauseOptions: RequestInit = {
	method: 'PUT',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };    

    private static readonly _deleteCauseOptions: RequestInit = {
	method: 'DELETE',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };

    private static readonly _getCauseAnalyticsOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };

    private static readonly _getActionsOverviewOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };    

    private readonly _env: Env;
    private readonly _coreServiceHost: string;
    private readonly _authInfoMarshaller: Marshaller<AuthInfo>;
    private readonly _createCauseRequestMarshaller: Marshaller<CreateCauseRequest>;
    private readonly _updateCauseRequestMarshaller: Marshaller<UpdateCauseRequest>;
    private readonly _privateCauseResponseMarshaller: Marshaller<PrivateCauseResponse>;
    private readonly _causeAnalyticsResponseMarshaller: Marshaller<CauseAnalyticsResponse>;
    private readonly _actionsOverviewResponseMarshaller: Marshaller<ActionsOverviewResponse>;
    private readonly _protocol: string;

    constructor(
	env: Env,
        coreServiceHost: string,
        authInfoMarshaller: Marshaller<AuthInfo>,
	createCauseRequestMarshaller: Marshaller<CreateCauseRequest>,
	updateCauseRequestMarshaller: Marshaller<UpdateCauseRequest>,
	privateCauseResponseMarshaller: Marshaller<PrivateCauseResponse>,
	causeAnalyticsResponseMarshaller: Marshaller<CauseAnalyticsResponse>,
	actionsOverviewResponseMarshaller: Marshaller<ActionsOverviewResponse>) {
	this._env = env;
        this._coreServiceHost = coreServiceHost;
        this._authInfoMarshaller = authInfoMarshaller;
	this._createCauseRequestMarshaller = createCauseRequestMarshaller;
	this._updateCauseRequestMarshaller = updateCauseRequestMarshaller;
	this._privateCauseResponseMarshaller = privateCauseResponseMarshaller;
	this._causeAnalyticsResponseMarshaller = causeAnalyticsResponseMarshaller;
	this._actionsOverviewResponseMarshaller = actionsOverviewResponseMarshaller;

	if (isLocal(this._env)) {
	    this._protocol = 'http';
	} else {
	    this._protocol = 'https';
	}	
    }

    async createCause(sessionId: string, auth0AccessToken: string, title: string, description: string, pictureSet: PictureSet, deadline: Date, goal: CurrencyAmount, bankInfo: BankInfo): Promise<PrivateCause> {
	const authInfo = new AuthInfo(sessionId, auth0AccessToken);
	const createCauseRequest = new CreateCauseRequest();
	createCauseRequest.title = title;
	createCauseRequest.description = description;
	createCauseRequest.pictureSet = pictureSet;
	createCauseRequest.deadline = deadline;
	createCauseRequest.goal = goal;
	createCauseRequest.bankInfo = bankInfo;

        const options = (Object as any).assign({}, CorePrivateClient._createCauseOptions, {
	    headers: {
		'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo)),
		'Content-Type': 'application/json'
	    },
	    body: JSON.stringify(this._createCauseRequestMarshaller.pack(createCauseRequest))
	});

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

    async getCause(sessionId: string, auth0AccessToken: string): Promise<PrivateCause> {
	const authInfo = new AuthInfo(sessionId, auth0AccessToken);

	const options = (Object as any).assign({}, CorePrivateClient._getCauseOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

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

    async updateCause(sessionId: string, auth0AccessToken: string, updateOptions: UpdateCauseOptions): Promise<PrivateCause> {
	const authInfo = new AuthInfo(sessionId, auth0AccessToken);
	const updateCauseRequest = new UpdateCauseRequest();

	// Hackety-hack-hack.
	for (let key in updateOptions) {
	    (updateCauseRequest as any)[key] = (updateOptions as any)[key];
	}

	const options = (Object as any).assign({}, CorePrivateClient._updateCauseOptions, {
	    headers: {
		'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo)),
		'Content-Type': 'application/json'
	    },
	    body: JSON.stringify(this._updateCauseRequestMarshaller.pack(updateCauseRequest))
	});

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

    async deleteCause(sessionId: string, auth0AccessToken: string): Promise<void> {
	const authInfo = new AuthInfo(sessionId, auth0AccessToken);

	const options = (Object as any).assign({}, CorePrivateClient._deleteCauseOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

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

    async getCauseAnalytics(sessionId: string, auth0AccessToken: string): Promise<CauseAnalytics> {
	const authInfo = new AuthInfo(sessionId, auth0AccessToken);

	const options = (Object as any).assign({}, CorePrivateClient._getCauseAnalyticsOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

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

    async getActionsOverview(sessionId: string, auth0AccessToken: string): Promise<UserActionsOverview> {
	const authInfo = new AuthInfo(sessionId, auth0AccessToken);

	const options = (Object as any).assign({}, CorePrivateClient._getActionsOverviewOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`${this._protocol}://${this._coreServiceHost}/private/actions-overview`, options);
	} catch (e) {
	    throw new CoreError(`Could not retrieve actions overview - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const actionsOverviewResponse = this._actionsOverviewResponseMarshaller.extract(jsonResponse);

		return actionsOverviewResponse.actionsOverview;
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
