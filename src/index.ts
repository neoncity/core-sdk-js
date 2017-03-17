export const FOO: string = 'bar';

import * as r from 'raynor'
import { ArrayOf, ExtractError, Marshaller, MarshalEnum, MarshalFrom, MarshalWith, OptionalOf } from 'raynor'

import { AuthInfo, User } from '@neoncity/identity-sdk-js'


export enum CauseState {
    Unknown = 0,
    Active = 1,
    Succeeded = 2,
    Removed = 3
}


class TitleMarshaller extends r.MaxLengthStringMarshaller {
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


class DescriptionMarshaller extends r.MaxLengthStringMarshaller {
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
    @MarshalWith(r.PositiveIntegerMarshaller)
    position: number;
    
    @MarshalWith(r.UriMarshaller)
    uri: string;

    @MarshalWith(r.PositiveIntegerMarshaller)
    width: number;

    @MarshalWith(r.PositiveIntegerMarshaller)
    height: number;
}


export class CurrencyAmount {
    @MarshalWith(r.PositiveIntegerMarshaller)
    amount: number;

    @MarshalWith(r.StringMarshaller)
    currency: string;
}


export class BankInfo {
    @MarshalWith(ArrayOf(r.StringMarshaller))
    ibans: string[];
}


export class Cause {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(MarshalEnum(CauseState))
    state: CauseState;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(r.TimeMarshaller)
    timeLastUpdated: Date;

    @MarshalWith(TitleMarshaller)
    title: string;

    @MarshalWith(DescriptionMarshaller)
    description: string;

    @MarshalWith(ArrayOf(MarshalFrom(Picture)))
    pictures: Picture[];

    @MarshalWith(r.TimeMarshaller)
    deadline: Date;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    goal: CurrencyAmount;

    @MarshalWith(MarshalFrom(BankInfo))
    bankInfo: BankInfo;
}


export class DonationForCause {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(MarshalFrom(User))
    fromUser: User;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;
}


export class DonationForUser {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(MarshalFrom(Cause))
    forCause: Cause;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;
}


export class ShareForCause {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(MarshalFrom(User))
    fromUser: User;
}


export class ShareForUser {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(r.TimeMarshaller)
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


export class UserDonationResponse {
    @MarshalWith(MarshalFrom(DonationForUser))
    donation: DonationForUser;
}


export class UserShareResponse {
    @MarshalWith(MarshalFrom(ShareForUser))
    share: ShareForUser;
}


export class CreateCauseRequest {
    @MarshalWith(TitleMarshaller)
    title: string;

    @MarshalWith(DescriptionMarshaller)
    description: string;

    @MarshalWith(ArrayOf(MarshalFrom(Picture)))
    pictures: Picture[];

    @MarshalWith(r.TimeMarshaller)
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

    @MarshalWith(OptionalOf(r.TimeMarshaller))
    deadline: Date|null;

    @MarshalWith(OptionalOf(MarshalFrom(CurrencyAmount)))
    goal: CurrencyAmount|null;

    @MarshalWith(OptionalOf(MarshalFrom(BankInfo)))
    bankInfo: BankInfo|null;
}


export class CreateDonationRequest {
    @MarshalWith(r.IdMarshaller)
    causeId: number;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;
}


export class CreateShareRequest {
    @MarshalWith(r.IdMarshaller)
    causeId: number;
}


export class CoreError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CoreError';
    }
}


export interface UpdateCauseOptions {
    title?: string;
    description?: string;
    pictures?: Picture[];
    deadline?: Date;
    goal?: CurrencyAmount;
    bankInfo?: BankInfo;
}


export function newCoreService(auth0AccessToken: string, coreServiceHost: string) {
    const authInfoMarshaller = new (MarshalFrom(AuthInfo))();
    const createCauseRequestMarshaller = new (MarshalFrom(CreateCauseRequest));
    const updateCauseRequestMarshaller = new (MarshalFrom(UpdateCauseRequest));
    const createDonationRequestMarshaller = new (MarshalFrom(CreateDonationRequest));
    const createShareRequestMarshaller = new (MarshalFrom(CreateShareRequest));
    const causesResponseMarshaller = new (MarshalFrom(CausesResponse));
    const causeResponseMarshaller = new (MarshalFrom(CauseResponse));
    const userDonationResponseMarshaller = new (MarshalFrom(UserDonationResponse));
    const userShareResponseMarshaller = new (MarshalFrom(UserShareResponse));
    
    return new CoreService(
        auth0AccessToken,
        coreServiceHost,
        authInfoMarshaller,
	createCauseRequestMarshaller,
	updateCauseRequestMarshaller,
	createDonationRequestMarshaller,
	createShareRequestMarshaller,
        causesResponseMarshaller,
	causeResponseMarshaller,
	userDonationResponseMarshaller,
	userShareResponseMarshaller);
}


export class CoreService {
    private static readonly _getCausesOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };

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
    
    private readonly _auth0AccessToken: string;
    private readonly _coreServiceHost: string;
    private readonly _authInfoMarshaller: Marshaller<AuthInfo>;
    private readonly _createCauseRequestMarshaller: Marshaller<CreateCauseRequest>;
    private readonly _updateCauseRequestMarshaller: Marshaller<UpdateCauseRequest>;
    private readonly _createDonationRequestMarshaller: Marshaller<CreateDonationRequest>;
    private readonly _createShareRequestMarshaller: Marshaller<CreateShareRequest>;
    private readonly _causesResponseMarshaller: Marshaller<CausesResponse>;
    private readonly _causeResponseMarshaller: Marshaller<CauseResponse>;
    private readonly _userDonationResponseMarshaller: Marshaller<UserDonationResponse>;
    private readonly _userShareResponseMarshaller: Marshaller<UserShareResponse>;    

    constructor(
        auth0AccessToken: string,
        coreServiceHost: string,
        authInfoMarshaller: Marshaller<AuthInfo>,
	createCauseRequestMarshaller: Marshaller<CreateCauseRequest>,
	updateCauseRequestMarshaller: Marshaller<UpdateCauseRequest>,
	createDonationRequestMarshaller: Marshaller<CreateDonationRequest>,
	createShareRequestMarshaller: Marshaller<CreateShareRequest>,
        causesResponseMarshaller: Marshaller<CausesResponse>,
	causeResponseMarshaller: Marshaller<CauseResponse>,
	userDonationResponseMarshaller: Marshaller<UserDonationResponse>,
	userShareResponseMarshaller: Marshaller<UserShareResponse>) {
        this._auth0AccessToken = auth0AccessToken;
        this._coreServiceHost = coreServiceHost;
        this._authInfoMarshaller = authInfoMarshaller;
	this._createCauseRequestMarshaller = createCauseRequestMarshaller;
	this._updateCauseRequestMarshaller = updateCauseRequestMarshaller;
	this._createDonationRequestMarshaller = createDonationRequestMarshaller;
	this._createShareRequestMarshaller = createShareRequestMarshaller;
        this._causesResponseMarshaller = causesResponseMarshaller;
	this._causeResponseMarshaller = causeResponseMarshaller;
	this._userDonationResponseMarshaller = userDonationResponseMarshaller;
	this._userShareResponseMarshaller = userShareResponseMarshaller;
    }

    async getCauses(): Promise<Cause[]> {
	const authInfo = new AuthInfo(this._auth0AccessToken);
	
        const options = (Object as any).assign({}, CoreService._getCausesOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

        let rawResponse: Response;
        try {
            rawResponse = await fetch(`http://${this._coreServiceHost}/causes`, options);
        } catch (e) {
            throw new CoreError(`Could not retrieve causes - request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const causesResponse = this._causesResponseMarshaller.extract(jsonResponse);

                return causesResponse.causes;
            } catch (e) {
                throw new CoreError(`Could not retrieve causes - '${e.toString()}'`);
            }
        } else {
            throw new CoreError(`Could not retrieve causes - service response ${rawResponse.status}`);
        }
    }

    async createCause(title: string, description: string, pictures: Picture[], deadline: Date, goal: CurrencyAmount, bankInfo: BankInfo): Promise<Cause> {
	const authInfo = new AuthInfo(this._auth0AccessToken);
	const createCauseRequest = new CreateCauseRequest();
	createCauseRequest.title = title;
	createCauseRequest.description = description;
	createCauseRequest.pictures = pictures;
	createCauseRequest.deadline = deadline;
	createCauseRequest.goal = goal;
	createCauseRequest.bankInfo = bankInfo;

        const options = (Object as any).assign({}, CoreService._createCauseOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))},
	    body: JSON.stringify(this._createCauseRequestMarshaller.pack(createCauseRequest))
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`http://${this._coreServiceHost}/causes`, options);
	} catch (e) {
	    throw new CoreError(`Could not create cause - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const causeResponse = this._causeResponseMarshaller.extract(jsonResponse);

		return causeResponse.cause;
	    } catch (e) {
		throw new CoreError(`Chould not retrieve cause - '${e.toString()}'`);
	    }
	} else {
	    throw new CoreError(`Could not retrieve cause - service response ${rawResponse.status}`);
	}
    }

    async getCause(causeId: number): Promise<Cause> {
	const authInfo = new AuthInfo(this._auth0AccessToken);

	const options = (Object as any).assign({}, CoreService._getCauseOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`http://${this._coreServiceHost}/causes/${causeId}`, options);
	} catch (e) {
	    throw new CoreError(`Could not retrieve cause ${causeId} - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const causeResponse = this._causeResponseMarshaller.extract(jsonResponse);

		return causeResponse.cause;
	    } catch (e) {
		throw new CoreError(`Could not retrieve cause ${causeId} - '${e.toString()}'`);
	    }
	} else {
	    throw new CoreError(`Could not retrieve cause ${causeId} - service response ${rawResponse.status}`);
	}
    }

    async updateCause(causeId: number, updateOptions: UpdateCauseOptions): Promise<Cause> {
	const authInfo = new AuthInfo(this._auth0AccessToken);
	const updateCauseRequest = new UpdateCauseRequest();

	// Hackety-hack-hack.
	for (let key in updateOptions) {
	    (updateCauseRequest as any)[key] = (updateOptions as any)[key];
	}

	const options = (Object as any).assign({}, CoreService._updateCauseOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))},
	    body: JSON.stringify(this._updateCauseRequestMarshaller.pack(updateCauseRequest))
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`http://${this._coreServiceHost}/causes/${causeId}`, options);
	} catch (e) {
	    throw new CoreError(`Could not update cause ${causeId} - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const causeResponse = this._causeResponseMarshaller.extract(jsonResponse);

		return causeResponse.cause;
	    } catch (e) {
		throw new CoreError(`Chould not update cause ${causeId} - '${e.toString()}'`);
	    }
	} else {
	    throw new CoreError(`Could not update cause ${causeId} - service response ${rawResponse.status}`);
	}
    }

    async deleteCause(causeId: number): Promise<void> {
	const authInfo = new AuthInfo(this._auth0AccessToken);

	const options = (Object as any).assign({}, CoreService._deleteCauseOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`http://${this._coreServiceHost}/causes/${causeId}`, options);
	} catch (e) {
	    throw new CoreError(`Could not delete cause ${causeId} - request failed because '${e.toString()}'`);
	}

	if (!rawResponse.ok) {
	    throw new CoreError(`Could not delete cause ${causeId} - service response ${rawResponse.status}`);
	}
    }

    async createDonation(causeId: number, amount: CurrencyAmount): Promise<DonationForUser> {
	const authInfo = new AuthInfo(this._auth0AccessToken);
	const createDonationRequest = new CreateDonationRequest();
	createDonationRequest.amount = amount;

        const options = (Object as any).assign({}, CoreService._createDonationOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))},
	    body: JSON.stringify(this._createDonationRequestMarshaller.pack(createDonationRequest))
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`http://${this._coreServiceHost}/causes/${causeId}/donations`, options);
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
	} else {
	    throw new CoreError(`Could not create donation for cause ${causeId} - service response ${rawResponse.status}`);
	}
    }

    async createShare(causeId: number): Promise<ShareForUser> {
	const authInfo = new AuthInfo(this._auth0AccessToken);
	const createShareRequest = new CreateShareRequest();

        const options = (Object as any).assign({}, CoreService._createShareOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))},
	    body: JSON.stringify(this._createShareRequestMarshaller.pack(createShareRequest))
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`http://${this._coreServiceHost}/causes/${causeId}/shares`, options);
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
	} else {
	    throw new CoreError(`Could not create share for cause ${causeId} - service response ${rawResponse.status}`);
	}
    }
}


async function main() {
    var s = newCoreService('ooo', 'localhost:10002');

    try {
        console.log(await s.getCauses());
    } catch (e) {
	console.log(e.toString());
    }
}

main().then(() => { console.log('Here'); });
