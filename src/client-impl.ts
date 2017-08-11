import 'isomorphic-fetch'
import * as HttpStatus from 'http-status-codes'
import { Marshaller, MarshalFrom } from 'raynor'

import { isLocal, Env, WebFetcher } from '@neoncity/common-js'
import { AuthInfo, Session } from '@neoncity/identity-sdk-js'

import {
    CauseDeletedForUserError,
    CoreError,
    CorePrivateClient,
    CorePublicClient,
    NoCauseForUserError,
    UnauthorizedCoreError,
    UpdateCauseOptions
} from './client'
import {
    BankInfo,
    CauseAnalytics,
    CauseSummary,
    CurrencyAmount,
    DonationForSession,
    PictureSet,
    PrivateCause,
    PublicCause,
    ShareForSession,
    UserActionsOverview
} from './entities'
import {
    CreateCauseRequest,
    CreateDonationRequest,
    CreateShareRequest,
    UpdateCauseRequest
} from './requests'
import {
    AllCauseSummariesResponse,
    CauseAnalyticsResponse,
    PrivateCauseResponse,
    PrivateCauseResponseMarshaller,
    PublicCausesResponse,
    PublicCauseResponse,
    SessionDonationResponse,
    SessionShareResponse,
    UserActionsOverviewResponse
} from './responses'



export function newCorePublicClient(env: Env, origin: string, coreServiceHost: string, webFetcher: WebFetcher): CorePublicClient {
    const authInfoMarshaller = new (MarshalFrom(AuthInfo))();
    const createDonationRequestMarshaller = new (MarshalFrom(CreateDonationRequest))();
    const createShareRequestMarshaller = new (MarshalFrom(CreateShareRequest))();
    const allCauseSummariesResponseMarshaller = new (MarshalFrom(AllCauseSummariesResponse))();
    const publicCausesResponseMarshaller = new (MarshalFrom(PublicCausesResponse))();
    const publicCauseResponseMarshaller = new (MarshalFrom(PublicCauseResponse))();
    const sessionDonationResponseMarshaller = new (MarshalFrom(SessionDonationResponse))();
    const sessionShareResponseMarshaller = new (MarshalFrom(SessionShareResponse))();

    return new CorePublicClientImpl(
        env,
        origin,
        coreServiceHost,
        webFetcher,
        authInfoMarshaller,
        createDonationRequestMarshaller,
        createShareRequestMarshaller,
        allCauseSummariesResponseMarshaller,
        publicCausesResponseMarshaller,
        publicCauseResponseMarshaller,
        sessionDonationResponseMarshaller,
        sessionShareResponseMarshaller);
}


class CorePublicClientImpl {
    private static readonly _getAllCauseSummariesOptions: RequestInit = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _getCausesOptions: RequestInit = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _getCauseOptions: RequestInit = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _createDonationOptions: RequestInit = {
        method: 'POST',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _createShareOptions: RequestInit = {
        method: 'POST',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private readonly _env: Env;
    private readonly _origin: string;
    private readonly _coreServiceHost: string;
    private readonly _webFetcher: WebFetcher;
    private readonly _authInfoMarshaller: Marshaller<AuthInfo>;
    private readonly _createDonationRequestMarshaller: Marshaller<CreateDonationRequest>;
    private readonly _createShareRequestMarshaller: Marshaller<CreateShareRequest>;
    private readonly _allCauseSummariesResponseMarshaller: Marshaller<AllCauseSummariesResponse>;
    private readonly _publicCausesResponseMarshaller: Marshaller<PublicCausesResponse>;
    private readonly _publicCauseResponseMarshaller: Marshaller<PublicCauseResponse>;
    private readonly _sessionDonationResponseMarshaller: Marshaller<SessionDonationResponse>;
    private readonly _sessionShareResponseMarshaller: Marshaller<SessionShareResponse>;
    private readonly _authInfo: AuthInfo | null;
    private readonly _defaultHeaders: HeadersInit;
    private readonly _protocol: string;

    constructor(
        env: Env,
        origin: string,
        coreServiceHost: string,
        webFetcher: WebFetcher,
        authInfoMarshaller: Marshaller<AuthInfo>,
        createDonationRequestMarshaller: Marshaller<CreateDonationRequest>,
        createShareRequestMarshaller: Marshaller<CreateShareRequest>,
        allCauseSummariesResponseMarshaller: Marshaller<AllCauseSummariesResponse>,
        publicCausesResponseMarshaller: Marshaller<PublicCausesResponse>,
        publicCauseResponseMarshaller: Marshaller<PublicCauseResponse>,
        sessionDonationResponseMarshaller: Marshaller<SessionDonationResponse>,
        sessionShareResponseMarshaller: Marshaller<SessionShareResponse>,
        authInfo: AuthInfo | null = null) {
        this._env = env;
        this._origin = origin;
        this._coreServiceHost = coreServiceHost;
        this._webFetcher = webFetcher;
        this._authInfoMarshaller = authInfoMarshaller;
        this._createDonationRequestMarshaller = createDonationRequestMarshaller;
        this._createShareRequestMarshaller = createShareRequestMarshaller;
        this._allCauseSummariesResponseMarshaller = allCauseSummariesResponseMarshaller;
        this._publicCausesResponseMarshaller = publicCausesResponseMarshaller;
        this._publicCauseResponseMarshaller = publicCauseResponseMarshaller;
        this._sessionDonationResponseMarshaller = sessionDonationResponseMarshaller;
        this._sessionShareResponseMarshaller = sessionShareResponseMarshaller;
        this._authInfo = authInfo;

        this._defaultHeaders = {
            'Origin': origin
        };

        if (authInfo != null) {
            this._defaultHeaders[AuthInfo.HeaderName] = JSON.stringify(this._authInfoMarshaller.pack(authInfo));
        }

        if (isLocal(this._env)) {
            this._protocol = 'http';
        } else {
            this._protocol = 'https';
        }
    }

    withContext(authInfo: AuthInfo): CorePublicClient {
        return new CorePublicClientImpl(
            this._env,
            this._origin,
            this._coreServiceHost,
            this._webFetcher,
            this._authInfoMarshaller,
            this._createDonationRequestMarshaller,
            this._createShareRequestMarshaller,
            this._allCauseSummariesResponseMarshaller,
            this._publicCausesResponseMarshaller,
            this._publicCauseResponseMarshaller,
            this._sessionDonationResponseMarshaller,
            this._sessionShareResponseMarshaller,
            authInfo);
    }

    async getAllCauseSummaries(): Promise<CauseSummary[]> {
        const options = this._buildOptions(CorePublicClientImpl._getAllCauseSummariesOptions);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/public/causes/summaries`, options);
        } catch (e) {
            throw new CoreError(`Could not retrieve cause summaries - request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const allCauseSummariesResponse = this._allCauseSummariesResponseMarshaller.extract(jsonResponse);

                return allCauseSummariesResponse.causeSummaries;
            } catch (e) {
                throw new CoreError(`Could not retrieve cause summaries - '${e.toString()}'`);
            }
        } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
            throw new UnauthorizedCoreError('User is not authorized');
        } else {
            throw new CoreError(`Could not retrieve cause summaries - service response ${rawResponse.status}`);
        }
    }

    async getCauses(): Promise<PublicCause[]> {
        const options = this._buildOptions(CorePublicClientImpl._getCausesOptions);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/public/causes`, options);
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
        const options = this._buildOptions(CorePublicClientImpl._getCauseOptions);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/public/causes/${causeId}`, options);
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

    async createDonation(session: Session, causeId: number, amount: CurrencyAmount): Promise<DonationForSession> {
        const createDonationRequest = new CreateDonationRequest();
        createDonationRequest.amount = amount;

        const options = this._buildOptions(CorePublicClientImpl._createDonationOptions, session);
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(this._createDonationRequestMarshaller.pack(createDonationRequest));

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/public/causes/${causeId}/donations`, options);
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

    async createShare(session: Session, causeId: number, facebookPostId: string): Promise<ShareForSession> {
        const createShareRequest = new CreateShareRequest();
        createShareRequest.facebookPostId = facebookPostId;

        const options = this._buildOptions(CorePublicClientImpl._createShareOptions, session);
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(this._createShareRequestMarshaller.pack(createShareRequest));

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/public/causes/${causeId}/shares`, options);
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

    private _buildOptions(template: RequestInit, session: Session | null = null) {
        const options = (Object as any).assign({ headers: this._defaultHeaders }, template);

        if (session != null) {
            options.headers = (Object as any).assign(options.headers, { [Session.XsrfTokenHeaderName]: session.xsrfToken });
        }

        return options;
    }
}


export function newCorePrivateClient(env: Env, origin: string, coreServiceHost: string, webFetcher: WebFetcher): CorePrivateClient {
    const authInfoMarshaller = new (MarshalFrom(AuthInfo))();
    const createCauseRequestMarshaller = new (MarshalFrom(CreateCauseRequest))();
    const updateCauseRequestMarshaller = new (MarshalFrom(UpdateCauseRequest))();
    const privateCauseResponseMarshaller = new PrivateCauseResponseMarshaller();
    const causeAnalyticsResponseMarshaller = new (MarshalFrom(CauseAnalyticsResponse))();
    const userActionsOverviewResponseMarshaller = new (MarshalFrom(UserActionsOverviewResponse))();

    return new CorePrivateClientImpl(
        env,
        origin,
        coreServiceHost,
        webFetcher,
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
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _getCauseOptions: RequestInit = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _updateCauseOptions: RequestInit = {
        method: 'PUT',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _deleteCauseOptions: RequestInit = {
        method: 'DELETE',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _getCauseAnalyticsOptions: RequestInit = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _getUserActionsOverviewOptions: RequestInit = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private readonly _env: Env;
    private readonly _origin: string;
    private readonly _coreServiceHost: string;
    private readonly _webFetcher: WebFetcher;
    private readonly _authInfoMarshaller: Marshaller<AuthInfo>;
    private readonly _createCauseRequestMarshaller: Marshaller<CreateCauseRequest>;
    private readonly _updateCauseRequestMarshaller: Marshaller<UpdateCauseRequest>;
    private readonly _privateCauseResponseMarshaller: Marshaller<PrivateCauseResponse>;
    private readonly _causeAnalyticsResponseMarshaller: Marshaller<CauseAnalyticsResponse>;
    private readonly _userActionsOverviewResponseMarshaller: Marshaller<UserActionsOverviewResponse>;
    private readonly _authInfo: AuthInfo | null;
    private readonly _defaultHeaders: HeadersInit;
    private readonly _protocol: string;

    constructor(
        env: Env,
        origin: string,
        coreServiceHost: string,
        webFetcher: WebFetcher,
        authInfoMarshaller: Marshaller<AuthInfo>,
        createCauseRequestMarshaller: Marshaller<CreateCauseRequest>,
        updateCauseRequestMarshaller: Marshaller<UpdateCauseRequest>,
        privateCauseResponseMarshaller: Marshaller<PrivateCauseResponse>,
        causeAnalyticsResponseMarshaller: Marshaller<CauseAnalyticsResponse>,
        userActionsOverviewResponseMarshaller: Marshaller<UserActionsOverviewResponse>,
        authInfo: AuthInfo | null = null) {
        this._env = env;
        this._origin = origin;
        this._coreServiceHost = coreServiceHost;
        this._webFetcher = webFetcher;
        this._authInfoMarshaller = authInfoMarshaller;
        this._createCauseRequestMarshaller = createCauseRequestMarshaller;
        this._updateCauseRequestMarshaller = updateCauseRequestMarshaller;
        this._privateCauseResponseMarshaller = privateCauseResponseMarshaller;
        this._causeAnalyticsResponseMarshaller = causeAnalyticsResponseMarshaller;
        this._userActionsOverviewResponseMarshaller = userActionsOverviewResponseMarshaller;
        this._authInfo = authInfo;

        this._defaultHeaders = {
            'Origin': origin
        };

        if (authInfo != null) {
            this._defaultHeaders[AuthInfo.HeaderName] = JSON.stringify(this._authInfoMarshaller.pack(authInfo));
        }

        if (isLocal(this._env)) {
            this._protocol = 'http';
        } else {
            this._protocol = 'https';
        }
    }

    withContext(authInfo: AuthInfo): CorePrivateClient {
        return new CorePrivateClientImpl(
            this._env,
            this._origin,
            this._coreServiceHost,
            this._webFetcher,
            this._authInfoMarshaller,
            this._createCauseRequestMarshaller,
            this._updateCauseRequestMarshaller,
            this._privateCauseResponseMarshaller,
            this._causeAnalyticsResponseMarshaller,
            this._userActionsOverviewResponseMarshaller,
            authInfo);
    }

    async createCause(session: Session, title: string, description: string, pictureSet: PictureSet, deadline: Date, goal: CurrencyAmount, bankInfo: BankInfo): Promise<PrivateCause> {
        const createCauseRequest = new CreateCauseRequest();
        createCauseRequest.title = title;
        createCauseRequest.description = description;
        createCauseRequest.pictureSet = pictureSet;
        createCauseRequest.deadline = deadline;
        createCauseRequest.goal = goal;
        createCauseRequest.bankInfo = bankInfo;

        const options = this._buildOptions(CorePrivateClientImpl._createCauseOptions, session);
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(this._createCauseRequestMarshaller.pack(createCauseRequest));

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/private/causes`, options);
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
        const options = this._buildOptions(CorePrivateClientImpl._getCauseOptions);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/private/causes`, options);
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

    async updateCause(session: Session, updateOptions: UpdateCauseOptions): Promise<PrivateCause> {
        const updateCauseRequest = new UpdateCauseRequest();

        // Hackety-hack-hack.
        for (let key in updateOptions) {
            (updateCauseRequest as any)[key] = (updateOptions as any)[key];
        }

        const options = this._buildOptions(CorePrivateClientImpl._updateCauseOptions, session);
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(this._updateCauseRequestMarshaller.pack(updateCauseRequest));

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/private/causes`, options);
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

    async deleteCause(session: Session): Promise<void> {
        const options = this._buildOptions(CorePrivateClientImpl._deleteCauseOptions, session);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/private/causes`, options);
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
        const options = this._buildOptions(CorePrivateClientImpl._getCauseAnalyticsOptions);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/private/causes/analytics`, options);
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
        const options = this._buildOptions(CorePrivateClientImpl._getUserActionsOverviewOptions);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._coreServiceHost}/private/user-actions-overview`, options);
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

    private _buildOptions(template: RequestInit, session: Session | null = null) {
        const options = (Object as any).assign({ headers: this._defaultHeaders }, template);

        if (session != null) {
            options.headers = (Object as any).assign(options.headers, { [Session.XsrfTokenHeaderName]: session.xsrfToken });
        }

        return options;
    }
}
