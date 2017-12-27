/** @format */

/**
 * External dependencies
 */
import { translate } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { http } from 'state/data-layer/wpcom-http/actions';
import { dispatchRequest } from 'state/data-layer/wpcom-http/utils';
import { errorNotice, removeNotice } from 'state/notices/actions';
import { navigate } from 'state/ui/actions';
import { updateLock } from '../../locks/actions';
import { ZONINATOR_REQUEST_LOCK } from 'zoninator/state/action-types';

const updateLockNotice = 'zoninator-update-lock';

export const requestZoneLock = ( { dispatch }, action ) => {
	const { siteId, zoneId } = action;

	dispatch( removeNotice( updateLockNotice ) );
	dispatch( http( {
		method: 'POST',
		path: `/jetpack-blogs/${ siteId }/rest-api/`,
		query: {
			path: `/zoninator/v1/zones/${ zoneId }/lock&_method=PUT`,
		},
	}, action ) );
};

export const handleLockSuccess = ( { dispatch }, { siteId, zoneId, refresh } ) =>
	! refresh && dispatch( updateLock( siteId, zoneId, true ) );

export const handleLockFailure = ( { dispatch }, { siteId, zoneId }, response ) => {
	if ( response.status === 400 && response.data && response.data.locking_user ) {
		dispatch( updateLock( siteId, zoneId, false ) );
		return;
	}

	dispatch( errorNotice( translate( 'There was a problem locking the zone. Please try again.' ), {
		id: updateLockNotice,
	} ) );
};

const dispatchCreateLockRequest = dispatchRequest(
	requestZoneLock,
	handleLockSuccess,
	handleLockFailure,
);

export default {
	[ ZONINATOR_REQUEST_LOCK ]: [ dispatchCreateLockRequest ],
};
