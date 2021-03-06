/**
 * External dependencies
 */
import { isEmpty, mapValues } from 'lodash';

/**
 * Checks the address object for the required fields
 * @param {Object} address the address object
 * @returns {Boolean} true if all required fields are not empty
 */
const addressFilled = ( address ) => Boolean(
	address && address.name && address.address && address.city && address.postcode && address.country
);

/**
 * Parses the data passed from the backed into a Redux state to be used in the label purchase flow
 * @param {Object} data data to initialize the labels state from
 * @returns {Object} labels Redux state
 */
export default ( data ) => {
	if ( ! data ) {
		return {
			loaded: false,
			isFetching: false,
			error: false,
		};
	}

	const {
		formData,
		labelsData,
		paperSize,
		storeOptions,
		canChangeCountries,
	} = data;

	//old WCS required a phone number and detected normalization status based on the existence of the phone field
	//newer versions send the normalized flag
	const originNormalized = Boolean( formData.origin_normalized || formData.origin.phone );
	const hasOriginAddress = addressFilled( formData.origin );
	const hasDestinationAddress = addressFilled( formData.destination );

	return {
		loaded: true,
		isFetching: false,
		error: false,
		refreshedLabelStatus: false,
		labels: labelsData || [],
		paperSize,
		storeOptions,
		fulfillOrder: true,
		emailDetails: true,
		form: {
			orderId: formData.order_id,
			origin: {
				values: formData.origin,
				isNormalized: originNormalized,
				normalized: originNormalized ? formData.origin : null,
				// If no origin address is stored, mark all fields as "ignore validation"
				// so the UI doesn't immediately show errors
				ignoreValidation: hasOriginAddress ? null : mapValues( formData.origin, () => true ),
				selectNormalized: true,
				normalizationInProgress: false,
				allowChangeCountry: Boolean( canChangeCountries ),
			},
			destination: {
				values: formData.destination,
				isNormalized: Boolean( formData.destination_normalized ),
				normalized: formData.destination_normalized ? formData.destination : null,
				// If no destination address is stored, mark all fields as "ignore validation"
				// so the UI doesn't immediately show errors
				ignoreValidation: hasDestinationAddress ? null : mapValues( formData.destination, () => true ),
				selectNormalized: true,
				normalizationInProgress: false,
				allowChangeCountry: Boolean( canChangeCountries ),
			},
			packages: {
				all: formData.all_packages,
				flatRateGroups: formData.flat_rate_groups,
				selected: formData.selected_packages,
				isPacked: formData.is_packed,
				saved: true,
			},
			rates: {
				values: isEmpty( formData.rates.selected )
					? mapValues( formData.packages, () => '' )
					: formData.rates.selected,
				available: {},
				retrievalInProgress: false,
			},
		},
		openedPackageId: Object.keys( formData.selected_packages )[ 0 ] || '',
	};
};
