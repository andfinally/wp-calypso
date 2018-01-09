/** @format */

/**
 * External dependencies
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { camelCase, difference, get, includes, isEmpty, keys, map, pick } from 'lodash';

/**
 * Internal dependencies
 */
import { getContactDetailsCache } from 'state/selectors';
import { updateContactDetailsCache } from 'state/domains/management/actions';
import FormInputValidation from 'components/forms/form-input-validation';
import FormFieldset from 'components/forms/form-fieldset';
import FormLabel from 'components/forms/form-label';
import FormSelect from 'components/forms/form-select';
import FormTextInput from 'components/forms/form-text-input';
import WithContactDetailsValidation from './with-contact-details-validation';

const defaultValues = {
	registrantType: 'IND',
};

class RegistrantExtraInfoUkForm extends React.PureComponent {
	static propTypes = {
		contactDetails: PropTypes.object.isRequired,
		translate: PropTypes.func.isRequired,
	};

	constructor( props ) {
		super( props );
		const { translate } = props;
		const registrantTypes = {
			IND: translate( 'Individual' ),
			FIND: translate( 'Foreign Individual' ),
			STRA: translate( 'UK Sole Trader', {
				comment: 'Refers to UK legal concept of self-employment/sole proprietorship',
			} ),
			PTNR: translate( 'UK Partnership' ),
			LLP: translate( 'UK Limited Liability Partnership' ),
			CRC: translate( 'UK Corporation by Royal Charter' ),
			FCORP: translate( 'Non-UK Corporation' ),
			IP: translate( 'UK Industrial/Provident Registered Company' ),
			LTD: translate( 'UK Limited Company' ),
			PLC: translate( 'UK Public Limited Company' ),
			SCH: translate( 'UK School' ),
			GOV: translate( 'UK Government Body' ),
			RCHAR: translate( 'UK Registered Charity' ),
			STAT: translate( 'UK Statutory Body' ),
			OTHER: translate( 'UK Entity that does not fit another category' ),
			FOTHER: translate( 'Non-UK Entity that does not fit another category' ),
		};
		this.registrantTypeOptions = map( registrantTypes, ( text, optionValue ) => (
			<option value={ optionValue } key={ optionValue }>
				{ text }
			</option>
		) );
	}

	componentWillMount() {
		// Add defaults to redux state to make accepting default values work.
		const neededRequiredDetails = difference(
			[ 'registrantType' ],
			keys( this.props.contactDetailsExtra )
		);

		// Bail early as we already have the details from a previous purchase.
		if ( isEmpty( neededRequiredDetails ) ) {
			return;
		}

		this.props.updateContactDetailsCache( {
			extra: pick( defaultValues, neededRequiredDetails ),
		} );
	}

	handleChangeEvent = event => {
		this.props.updateContactDetailsCache( {
			extra: { [ camelCase( event.target.id ) ]: event.target.value },
		} );
	};

	isTradingNameRequired( registrantType ) {
		return includes(
			[ 'LTD', 'PLC', 'LLP', 'IP', 'RCHAR', 'FCORP', 'OTHER', 'FOTHER', 'STRA' ],
			registrantType
		);
	}

	isRegistrationNumberRequired( registrantType ) {
		return includes( [ 'LTD', 'PLC', 'LLP', 'IP', 'SCH', 'RCHAR' ], registrantType );
	}

	renderTradingNameField() {
		const { contactDetails, translate } = this.props;
		const { tradingName } = contactDetails.extra;
		const tradingNameErrors = get(
			this.props.validationErrors,
			[ 'contactDetails', 'extra', 'tradingName' ],
			[]
		);
		const isError = ! isEmpty( tradingNameErrors );

		return (
			<div>
				<FormFieldset>
					<FormLabel className="registrant-extra-info__trading-name" htmlFor="trading-name">
						{ translate( 'Trading Name' ) }
					</FormLabel>
					<FormTextInput
						id="trading-name"
						value={ tradingName }
						autoCapitalize="off"
						autoComplete="off"
						autoCorrect="off"
						placeholder={ '' }
						onChange={ this.handleChangeEvent }
						isError={ isError }
					/>
					{ map( tradingNameErrors, this.renderValidationError ) }
				</FormFieldset>
			</div>
		);
	}

	renderRegistrationNumberField() {
		const { contactDetails, translate } = this.props;
		const { registrationNumber } = contactDetails.extra || '';
		const registrationNumberErrors = get(
			this.props.validationErrors,
			[ 'contactDetails', 'extra', 'registrationNumber' ],
			[]
		);
		const isError = ! isEmpty( registrationNumberErrors );

		return (
			<div>
				<FormFieldset>
					<FormLabel
						className="registrant-extra-info__registration-number"
						htmlFor="registration-number"
					>
						{ translate( 'Registration Number' ) }
					</FormLabel>
					<FormTextInput
						id="registration-number"
						value={ registrationNumber }
						autoCapitalize="off"
						autoComplete="off"
						autoCorrect="off"
						placeholder={ '' }
						onChange={ this.handleChangeEvent }
						isError={ isError }
					/>
					{ map( registrationNumberErrors, this.renderValidationError ) }
				</FormFieldset>
			</div>
		);
	}

	renderValidationError( message ) {
		return <FormInputValidation isError key={ message } text={ message } />;
	}

	render() {
		const { translate } = this.props;
		const { registrantType } = {
			...defaultValues,
			...this.props.contactDetails.extra,
		};

		return (
			<form className="registrant-extra-info__form">
				<p className="registrant-extra-info__form-desciption">
					{ translate( 'Almost done! We need some extra details to register your %(tld)s domain.', {
						args: { tld: '.uk' },
					} ) }
				</p>
				<FormFieldset>
					<FormLabel htmlFor="registrant-type">
						{ translate(
							'Choose the option that best describes your presence in the United Kingdom:'
						) }
					</FormLabel>
					<FormSelect
						id="registrant-type"
						value={ registrantType }
						className="registrant-extra-info__form-registrant-type"
						onChange={ this.handleChangeEvent }
					>
						{ this.registrantTypeOptions }
					</FormSelect>
				</FormFieldset>

				{ this.isTradingNameRequired( registrantType ) && this.renderTradingNameField() }

				{ this.isRegistrationNumberRequired( registrantType ) &&
					this.renderRegistrationNumberField() }

				{ this.props.children }
			</form>
		);
	}
}

export default connect(
	state => ( {
		contactDetails: getContactDetailsCache( state ),
	} ),
	{ updateContactDetailsCache }
)( WithContactDetailsValidation( 'uk', localize( RegistrantExtraInfoUkForm ) ) );
