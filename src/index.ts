import * as HttpStatus from 'http-status-codes'
import * as r from 'raynor'
import { ArrayOf, ExtractError, Marshaller, MarshalEnum, MarshalFrom, MarshalWith, OneOf2, OptionalOf } from 'raynor'

import { Currency, CurrencyMarshaller } from '@neoncity/common-js/currency'
import { IBAN, IBANMarshaller } from '@neoncity/common-js/iban'
import { AuthInfo, User } from '@neoncity/identity-sdk-js'


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
    
    @MarshalWith(r.UriMarshaller)
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
    @MarshalWith(r.PositiveIntegerMarshaller)
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


export class DonationForCause {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;

    @MarshalWith(MarshalFrom(User))
    fromUser: User;
}


export class DonationForUser {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;

    @MarshalWith(MarshalFrom(PublicCause))
    forCause: PublicCause;
}


export class ShareForCause {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(FacebookPostIdMarshaller)
    facebookPostId: string;

    @MarshalWith(MarshalFrom(User))
    fromUser: User;
}


export class ShareForUser {
    @MarshalWith(r.IdMarshaller)
    id: number;

    @MarshalWith(r.TimeMarshaller)
    timeCreated: Date;

    @MarshalWith(FacebookPostIdMarshaller)
    facebookPostId: string;

    @MarshalWith(MarshalFrom(PublicCause))
    forCause: PublicCause;
}


export class UserActionsOverview {
    @MarshalWith(ArrayOf(MarshalFrom(DonationForUser)))
    donations: DonationForUser[];

    @MarshalWith(ArrayOf(MarshalFrom(ShareForUser)))
    shares: ShareForUser[];    
}


export class PublicCausesResponse {
    @MarshalWith(ArrayOf(MarshalFrom(PublicCause)))
    causes: PublicCause[];
}


export class PublicCauseResponse {
    @MarshalWith(MarshalFrom(PublicCause))
    cause: PublicCause;
}


export class CreateDonationRequest {
    @MarshalWith(MarshalFrom(CurrencyAmount))
    amount: CurrencyAmount;
}


export class CreateShareRequest {
    @MarshalWith(FacebookPostIdMarshaller)
    facebookPostId: string;
}


export class PrivateCauseResponse {
    @MarshalWith(MarshalFrom(PrivateCause))
    cause: PrivateCause;
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


export class ActionsOverviewResponse {
    @MarshalWith(MarshalFrom(UserActionsOverview))
    actionsOverview: UserActionsOverview;
}


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


export class CauseEventsResponse {
    @MarshalWith(ArrayOf(MarshalFrom(CauseEvent)))
    events: CauseEvent[];
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


export function newCorePublicClient(coreServiceHost: string) {
    const authInfoMarshaller = new (MarshalFrom(AuthInfo))();
    const createDonationRequestMarshaller = new (MarshalFrom(CreateDonationRequest));
    const createShareRequestMarshaller = new (MarshalFrom(CreateShareRequest));
    const publicCausesResponseMarshaller = new (MarshalFrom(PublicCausesResponse));
    const publicCauseResponseMarshaller = new (MarshalFrom(PublicCauseResponse));
    const userDonationResponseMarshaller = new (MarshalFrom(UserDonationResponse));
    const userShareResponseMarshaller = new (MarshalFrom(UserShareResponse));
    
    return new CorePublicClient(
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
    private static readonly _getPublicCausesOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };

    private static readonly _getPublicCauseOptions: RequestInit = {
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
    
    private readonly _coreServiceHost: string;
    private readonly _authInfoMarshaller: Marshaller<AuthInfo>;
    private readonly _createDonationRequestMarshaller: Marshaller<CreateDonationRequest>;
    private readonly _createShareRequestMarshaller: Marshaller<CreateShareRequest>;
    private readonly _publicCausesResponseMarshaller: Marshaller<PublicCausesResponse>;
    private readonly _publicCauseResponseMarshaller: Marshaller<PublicCauseResponse>;
    private readonly _userDonationResponseMarshaller: Marshaller<UserDonationResponse>;
    private readonly _userShareResponseMarshaller: Marshaller<UserShareResponse>;    
    
    constructor(
	coreServiceHost: string,
	authInfoMarshaller: Marshaller<AuthInfo>,
	createDonationRequestMarshaller: Marshaller<CreateDonationRequest>,
	createShareRequestMarshaller: Marshaller<CreateShareRequest>,
        publicCausesResponseMarshaller: Marshaller<PublicCausesResponse>,
	publicCauseResponseMarshaller: Marshaller<PublicCauseResponse>,
	userDonationResponseMarshaller: Marshaller<UserDonationResponse>,
	userShareResponseMarshaller: Marshaller<UserShareResponse>) {
	this._coreServiceHost = coreServiceHost;
	this._authInfoMarshaller = authInfoMarshaller;
	this._createDonationRequestMarshaller = createDonationRequestMarshaller;
	this._createShareRequestMarshaller = createShareRequestMarshaller;
        this._publicCausesResponseMarshaller = publicCausesResponseMarshaller;
	this._publicCauseResponseMarshaller = publicCauseResponseMarshaller;
	this._userDonationResponseMarshaller = userDonationResponseMarshaller;
	this._userShareResponseMarshaller = userShareResponseMarshaller;
    }
    
    async getCauses(accessToken: string|null): Promise<PublicCause[]> {
	let options: RequestInit = CorePublicClient._getPublicCausesOptions;
	if (accessToken != null) {
	    const authInfo = new AuthInfo(accessToken);
	
            options = (Object as any).assign({}, CorePublicClient._getPublicCausesOptions, {
		headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	    });
	}

        let rawResponse: Response;
        try {
            rawResponse = await fetch(`http://${this._coreServiceHost}/public/causes`, options);
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

    async getCause(accessToken: string|null, causeId: number): Promise<PublicCause> {
	let options: RequestInit = CorePublicClient._getPublicCauseOptions;
	if (accessToken != null) {
	    const authInfo = new AuthInfo(accessToken);
	
            options = (Object as any).assign({}, CorePublicClient._getPublicCauseOptions, {
		headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	    });
	}

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`http://${this._coreServiceHost}/public/causes/${causeId}`, options);
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

    async createDonation(accessToken: string, causeId: number, amount: CurrencyAmount): Promise<DonationForUser> {
	const authInfo = new AuthInfo(accessToken);
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
	    rawResponse = await fetch(`http://${this._coreServiceHost}/public/causes/${causeId}/donations`, options);
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

    async createShare(accessToken: string, causeId: number, facebookPostId: string): Promise<ShareForUser> {
	const authInfo = new AuthInfo(accessToken);
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
	    rawResponse = await fetch(`http://${this._coreServiceHost}/public/causes/${causeId}/shares`, options);
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


export function newCorePrivateClient(coreServiceHost: string) {
    const authInfoMarshaller = new (MarshalFrom(AuthInfo))();
    const createCauseRequestMarshaller = new (MarshalFrom(CreateCauseRequest))();
    const updateCauseRequestMarshaller = new (MarshalFrom(UpdateCauseRequest))();
    const privateCauseResponseMarshaller = new (MarshalFrom(PrivateCauseResponse))();
    const actionsOverviewResponseMarshaller = new (MarshalFrom(ActionsOverviewResponse))();
    
    return new CorePrivateClient(
        coreServiceHost,
        authInfoMarshaller,
	createCauseRequestMarshaller,
	updateCauseRequestMarshaller,
	privateCauseResponseMarshaller,
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

    private static readonly _getActionsOverviewOptions: RequestInit = {
	method: 'GET',
	mode: 'cors',
	cache: 'no-cache',
	redirect: 'error',
	referrer: 'client'
    };
    
    private readonly _coreServiceHost: string;
    private readonly _authInfoMarshaller: Marshaller<AuthInfo>;
    private readonly _createCauseRequestMarshaller: Marshaller<CreateCauseRequest>;
    private readonly _updateCauseRequestMarshaller: Marshaller<UpdateCauseRequest>;
    private readonly _privateCauseResponseMarshaller: Marshaller<PrivateCauseResponse>;
    private readonly _actionsOverviewResponseMarshaller: Marshaller<ActionsOverviewResponse>;

    constructor(
        coreServiceHost: string,
        authInfoMarshaller: Marshaller<AuthInfo>,
	createCauseRequestMarshaller: Marshaller<CreateCauseRequest>,
	updateCauseRequestMarshaller: Marshaller<UpdateCauseRequest>,
	privateCauseResponseMarshaller: Marshaller<PrivateCauseResponse>,
	actionsOverviewResponseMarshaller: Marshaller<ActionsOverviewResponse>) {
        this._coreServiceHost = coreServiceHost;
        this._authInfoMarshaller = authInfoMarshaller;
	this._createCauseRequestMarshaller = createCauseRequestMarshaller;
	this._updateCauseRequestMarshaller = updateCauseRequestMarshaller;
	this._privateCauseResponseMarshaller = privateCauseResponseMarshaller;
	this._actionsOverviewResponseMarshaller = actionsOverviewResponseMarshaller;
    }

    async createCause(accessToken: string, title: string, description: string, pictureSet: PictureSet, deadline: Date, goal: CurrencyAmount, bankInfo: BankInfo): Promise<PrivateCause> {
	const authInfo = new AuthInfo(accessToken);
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
	    rawResponse = await fetch(`http://${this._coreServiceHost}/private/causes`, options);
	} catch (e) {
	    throw new CoreError(`Could not create cause - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const privateCauseResponse = this._privateCauseResponseMarshaller.extract(jsonResponse);

		return privateCauseResponse.cause;
	    } catch (e) {
		throw new CoreError(`Chould not retrieve cause - '${e.toString()}'`);
	    }
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else {
	    throw new CoreError(`Could not retrieve cause - service response ${rawResponse.status}`);
	}
    }

    async getCause(accessToken: string): Promise<PrivateCause> {
	const authInfo = new AuthInfo(accessToken);

	const options = (Object as any).assign({}, CorePrivateClient._getCauseOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`http://${this._coreServiceHost}/private/causes`, options);
	} catch (e) {
	    throw new CoreError(`Could not retrieve cause - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const privateCauseResponse = this._privateCauseResponseMarshaller.extract(jsonResponse);

		return privateCauseResponse.cause;
	    } catch (e) {
		throw new CoreError(`Could not retrieve cause - '${e.toString()}'`);
	    }
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
        } else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new NoCauseForUserError('User does not have a cause');
	} else {
	    throw new CoreError(`Could not retrieve cause - service response ${rawResponse.status}`);
	}
    }

    async updateCause(accessToken: string, updateOptions: UpdateCauseOptions): Promise<PrivateCause> {
	const authInfo = new AuthInfo(accessToken);
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
	    rawResponse = await fetch(`http://${this._coreServiceHost}/private/causes`, options);
	} catch (e) {
	    throw new CoreError(`Could not update cause - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    try {
		const jsonResponse = await rawResponse.json();
		const privateCauseResponse = this._privateCauseResponseMarshaller.extract(jsonResponse);

		return privateCauseResponse.cause;
	    } catch (e) {
		throw new CoreError(`Chould not update cause - '${e.toString()}'`);
	    }
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else {
	    throw new CoreError(`Could not update cause - service response ${rawResponse.status}`);
	}
    }

    async deleteCause(accessToken: string): Promise<void> {
	const authInfo = new AuthInfo(accessToken);

	const options = (Object as any).assign({}, CorePrivateClient._deleteCauseOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`http://${this._coreServiceHost}/private/causes`, options);
	} catch (e) {
	    throw new CoreError(`Could not delete cause - request failed because '${e.toString()}'`);
	}

	if (rawResponse.ok) {
	    // Do nothing
	} else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
	    throw new UnauthorizedCoreError('User is not authorized');
	} else {
	    throw new CoreError(`Could not delete cause - service response ${rawResponse.status}`);
	} 
    }

    async getActionsOverview(accessToken: string): Promise<UserActionsOverview> {
	const authInfo = new AuthInfo(accessToken);

	const options = (Object as any).assign({}, CorePrivateClient._getActionsOverviewOptions, {
	    headers: {'X-NeonCity-AuthInfo': JSON.stringify(this._authInfoMarshaller.pack(authInfo))}
	});

	let rawResponse: Response;
	try {
	    rawResponse = await fetch(`http://${this._coreServiceHost}/private/actions-overview`, options);
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
