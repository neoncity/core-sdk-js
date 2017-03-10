export const FOO: string = 'bar';

import * as m from '@neoncity/common-js/marshall'
import { ArrayOf, ExtractError, MarshalEnum, MarshalFrom, MarshalWith } from '@neoncity/common-js/marshall'


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


export class Goal {
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

    @MarshalWith(MarshalFrom(Goal))
    goal: Goal;

    @MarshalWith(MarshalFrom(BankInfo))
    bankInfo: BankInfo;
}
