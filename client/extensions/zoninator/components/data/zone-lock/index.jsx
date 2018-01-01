/** @format */

/**
 * External dependencies
 */
import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { requestLock } from '../../../state/locks/actions';
import {
	isRequesting,
	getLock,
	getLockTimeCreated,
	getMaxLockPeriod,
} from '../../../state/locks/selectors';

class ZoneLock extends PureComponent {
	static propTypes = {
		isRequesting: PropTypes.bool,
		lock: PropTypes.number,
		maxLockPeriod: PropTypes.number,
		requestLock: PropTypes.func.isRequired,
		timeCreated: PropTypes.number,
		siteId: PropTypes.number.isRequired,
		zoneId: PropTypes.number.isRequired,
	};

	componentWillMount() {
		this.requestLock( this.props, true );
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.siteId === nextProps.siteId && this.props.zoneId === nextProps.zoneId ) {
			this.scheduleRefresh( nextProps );
			return;
		}

		this.requestLock( nextProps, true );
	}

	componentWillUnmount() {
		this._refresh && clearTimeout( this._refresh );
		this._refresh = null;
	}

	requestLock( props, reset ) {
		! props.isRequesting &&
			props.siteId &&
			props.zoneId &&
			props.requestLock( props.siteId, props.zoneId, reset );
	}

	scheduleRefresh( props ) {
		if ( ! this.shouldRefresh( props ) ) {
			return;
		}

		// Request a refresh one second before the current lock expires
		this._refresh = setTimeout( () => {
			this._refresh = null;
			this.requestLock( props, false );
		}, props.lock - new Date().getTime() - 1000 );
	}

	shouldRefresh = ( { lock, timeCreated, maxLockPeriod } ) =>
		! this._refresh && lock && new Date().getTime() < lock && lock < timeCreated + maxLockPeriod;

	render() {
		return null;
	}
}

const connectComponent = connect(
	( state, { siteId, zoneId } ) => ( {
		isRequesting: isRequesting( state, siteId, zoneId ),
		lock: getLock( state, siteId, zoneId ),
		maxLockPeriod: getMaxLockPeriod( state, siteId ),
		timeCreated: getLockTimeCreated( state, siteId, zoneId ),
	} ),
	{ requestLock }
);

export default connectComponent( ZoneLock );
