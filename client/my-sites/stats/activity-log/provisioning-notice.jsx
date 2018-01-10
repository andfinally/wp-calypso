/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import CompactCard from 'components/card/compact';
import Gridicon from 'gridicons';

export const ProvisioningNotice = ( { translate } ) => (
	<CompactCard highlight="info" className="activity-log__provisioning-notice">
		<span className="activity-log__provisioning-notice-icon">
			<Gridicon icon="history" size={ 24 } />
		</span>
		<span className="activity-log__provisioning-notice-text">
			{ translate(
				'Your site is currently being configured. ' +
					"There's nothing else you need to do right now — " +
					'check back soon to see your updated Activity Log ' +
					'or restore backups.'
			) }
		</span>
	</CompactCard>
);

export default localize( ProvisioningNotice );
