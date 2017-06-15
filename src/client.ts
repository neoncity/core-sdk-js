import 'isomorphic-fetch'

import { AuthInfo, Session } from '@neoncity/identity-sdk-js'

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


export interface CorePublicClient {
    withContext(authInfo: AuthInfo, origin: string): CorePublicClient;
    getCauses(): Promise<PublicCause[]>;
    getCause(causeId: number): Promise<PublicCause>;
    createDonation(session: Session, causeId: number, amount: CurrencyAmount): Promise<DonationForSession>;
    createShare(session: Session, causeId: number, facebookPostId: string): Promise<ShareForSession>;
}


export interface CorePrivateClient {
    withContext(authInfo: AuthInfo, origin: string): CorePrivateClient;
    createCause(session: Session, title: string, description: string, pictureSet: PictureSet, deadline: Date, goal: CurrencyAmount, bankInfo: BankInfo): Promise<PrivateCause>;
    getCause(): Promise<PrivateCause>;
    updateCause(session: Session, updateOptions: UpdateCauseOptions): Promise<PrivateCause>;
    deleteCause(session: Session): Promise<void>;
    getCauseAnalytics(): Promise<CauseAnalytics>;
    getUserActionsOverview(): Promise<UserActionsOverview>;
}
