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
			{ translate( 'We are currently configuring your site to start protecting it with Rewind.' ) }
		</span>
	</CompactCard>
);

export default localize( ProvisioningNotice );
