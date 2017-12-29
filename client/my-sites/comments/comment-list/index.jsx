/** @format */

/**
 * External dependencies
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { find, get, isEqual, isUndefined, map, orderBy, slice } from 'lodash';
import ReactCSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';

/**
 * Internal dependencies
 */
import Comment from 'my-sites/comments/comment';
import CommentListHeader from 'my-sites/comments/comment-list/comment-list-header';
import CommentNavigation from 'my-sites/comments/comment-navigation';
import EmptyContent from 'components/empty-content';
import Pagination from 'components/pagination';
import QuerySiteCommentsList from 'components/data/query-site-comments-list';
import QuerySiteCommentsTree from 'components/data/query-site-comments-tree';
import QuerySiteSettings from 'components/data/query-site-settings';
import { getCommentsPage, getSiteCommentCounts } from 'state/selectors';
import { bumpStat, composeAnalytics, recordTracksEvent } from 'state/analytics/actions';
import { COMMENTS_PER_PAGE, NEWEST_FIRST } from '../constants';

export class CommentList extends Component {
	static propTypes = {
		changePage: PropTypes.func,
		comments: PropTypes.array,
		recordChangePage: PropTypes.func,
		replyComment: PropTypes.func,
		siteId: PropTypes.number,
		status: PropTypes.string,
		translate: PropTypes.func,
	};

	state = {
		isBulkMode: false,
		lastUndo: null,
		selectedComments: [],
		sortOrder: NEWEST_FIRST,
	};

	componentWillReceiveProps( nextProps ) {
		const { siteId, status, changePage } = this.props;
		const totalPages = this.getTotalPages();
		if ( ! this.isRequestedPageValid() && totalPages > 1 ) {
			return changePage( totalPages );
		}

		if ( siteId !== nextProps.siteId || status !== nextProps.status ) {
			this.setState( {
				isBulkMode: false,
				lastUndo: null,
				selectedComments: [],
			} );
		}
	}

	shouldComponentUpdate = ( nextProps, nextState ) =>
		! isEqual( this.props, nextProps ) || ! isEqual( this.state, nextState );

	changePage = page => {
		const { recordChangePage, changePage } = this.props;

		recordChangePage( page, this.getTotalPages() );

		this.setState( { selectedComments: [] } );

		changePage( page );
	};

	getComments = () => orderBy( this.props.comments, null, this.state.sortOrder );

	getCommentsPage = ( comments, page ) => {
		const startingIndex = ( page - 1 ) * COMMENTS_PER_PAGE;
		return slice( comments, startingIndex, startingIndex + COMMENTS_PER_PAGE );
	};

	getEmptyMessage = () => {
		const { status, translate } = this.props;

		const defaultLine = translate( 'Your queue is clear.' );

		return get(
			{
				unapproved: [ translate( 'No pending comments.' ), defaultLine ],
				approved: [ translate( 'No approved comments.' ), defaultLine ],
				spam: [ translate( 'No spam comments.' ), defaultLine ],
				trash: [ translate( 'No deleted comments.' ), defaultLine ],
				all: [ translate( 'No comments yet.' ), defaultLine ],
			},
			status,
			[ '', '' ]
		);
	};

	getTotalPages = () => Math.ceil( this.props.comments.length / COMMENTS_PER_PAGE );

	hasCommentJustMovedBackToCurrentStatus = commentId => this.state.lastUndo === commentId;

	isCommentSelected = commentId => !! find( this.state.selectedComments, { commentId } );

	isRequestedPageValid = () => this.getTotalPages() >= this.props.page;

	isSelectedAll = () => {
		const { page } = this.props;
		const { selectedComments } = this.state;
		const visibleComments = this.getCommentsPage( this.getComments(), page );
		return selectedComments.length && selectedComments.length === visibleComments.length;
	};

	setSortOrder = order => () => {
		this.setState( {
			sortOrder: order,
			page: 1,
		} );
	};

	toggleBulkMode = () => {
		this.setState( ( { isBulkMode } ) => ( { isBulkMode: ! isBulkMode, selectedComments: [] } ) );
	};

	toggleCommentSelected = comment => {
		if ( this.isCommentSelected( comment.commentId ) ) {
			return this.setState( ( { selectedComments } ) => ( {
				selectedComments: selectedComments.filter(
					( { commentId } ) => comment.commentId !== commentId
				),
			} ) );
		}
		this.setState( ( { selectedComments } ) => ( {
			selectedComments: selectedComments.concat( comment ),
		} ) );
	};

	toggleSelectAll = selectedComments => this.setState( { selectedComments } );

	updateLastUndo = commentId => this.setState( { lastUndo: commentId } );

	render() {
		const {
			isCommentsTreeSupported,
			isLoading,
			isPostView,
			page,
			postId,
			siteId,
			siteFragment,
			status,
		} = this.props;
		const { isBulkMode, selectedComments } = this.state;

		const validPage = this.isRequestedPageValid() ? page : 1;

		const comments = this.getComments();
		const commentsCount = comments.length;
		const commentsPage = this.getCommentsPage( comments, validPage );

		const showPlaceholder = ( ! siteId || isLoading ) && ! commentsCount;
		const showEmptyContent = ! commentsCount && ! showPlaceholder;

		const [ emptyMessageTitle, emptyMessageLine ] = this.getEmptyMessage();

		return (
			<div className="comment-list">
				<QuerySiteSettings siteId={ siteId } />

				{ ! isCommentsTreeSupported && (
					<QuerySiteCommentsList
						number={ 100 }
						offset={ ( validPage - 1 ) * COMMENTS_PER_PAGE }
						siteId={ siteId }
						status={ status }
					/>
				) }
				{ isCommentsTreeSupported && <QuerySiteCommentsTree siteId={ siteId } status={ status } /> }

				{ isPostView && <CommentListHeader postId={ postId } /> }

				<CommentNavigation
					commentsPage={ commentsPage }
					isBulkMode={ isBulkMode }
					isSelectedAll={ this.isSelectedAll() }
					postId={ postId }
					selectedComments={ selectedComments }
					setSortOrder={ this.setSortOrder }
					sortOrder={ this.state.sortOrder }
					siteId={ siteId }
					siteFragment={ siteFragment }
					status={ status }
					toggleBulkMode={ this.toggleBulkMode }
					toggleSelectAll={ this.toggleSelectAll }
				/>

				<ReactCSSTransitionGroup
					className="comment-list__transition-wrapper"
					transitionEnterTimeout={ 150 }
					transitionLeaveTimeout={ 150 }
					transitionName="comment-list__transition"
				>
					{ map( commentsPage, commentId => (
						<Comment
							commentId={ commentId }
							key={ `comment-${ siteId }-${ commentId }` }
							isBulkMode={ isBulkMode }
							isPostView={ isPostView }
							isSelected={ this.isCommentSelected( commentId ) }
							refreshCommentData={
								isCommentsTreeSupported &&
								! this.hasCommentJustMovedBackToCurrentStatus( commentId )
							}
							toggleSelected={ this.toggleCommentSelected }
							updateLastUndo={ this.updateLastUndo }
						/>
					) ) }

					{ showPlaceholder && <Comment commentId={ 0 } key="comment-detail-placeholder" /> }

					{ showEmptyContent && (
						<EmptyContent
							illustration="/calypso/images/comments/illustration_comments_gray.svg"
							illustrationWidth={ 150 }
							key="comment-list-empty"
							line={ emptyMessageLine }
							title={ emptyMessageTitle }
						/>
					) }
				</ReactCSSTransitionGroup>

				{ ! showPlaceholder &&
					! showEmptyContent && (
						<Pagination
							key="comment-list-pagination"
							page={ validPage }
							pageClick={ this.changePage }
							perPage={ COMMENTS_PER_PAGE }
							total={ commentsCount }
						/>
					) }
			</div>
		);
	}
}

const mapStateToProps = ( state, { page, postId, siteId, status } ) => {
	const comments = getCommentsPage( state, siteId, { page, postId, status } ) || [];
	const commentsCount = get(
		getSiteCommentCounts( state, siteId, postId ),
		'unapproved' === status ? 'pending' : status
	);
	const isLoading = isUndefined( comments );
	const isPostView = !! postId;

	return {
		comments,
		commentsCount,
		isLoading,
		isPostView,
	};
};

const mapDispatchToProps = dispatch => ( {
	recordChangePage: ( page, total ) =>
		dispatch(
			composeAnalytics(
				recordTracksEvent( 'calypso_comment_management_change_page', { page, total } ),
				bumpStat( 'calypso_comment_management', 'change_page' )
			)
		),
} );

export default connect( mapStateToProps, mapDispatchToProps )( localize( CommentList ) );
