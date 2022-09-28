import React, { Component } from "react";
import { ListGroup } from "react-bootstrap";

const PAGE_LENGTH = 5;
class MovieSidePanel extends Component {

	constructor(props) {
		super(props);

		this.state = {
			allRecomm: [],
			genres: [],
			selGenre: 'all',
			filtered: [],
			page: 0,
			maxPages: 0,
		}
	}

	getPrimaryGenre(genreStr) {
		return genreStr.split('|')[0];
	}

	componentDidMount() {
		if (this.props.movieList.length !== 0) {
			let newGenres = [];
			this.props.movieList.forEach(item => {
				const currGenre = this.getPrimaryGenre(item.genre);
				if (!newGenres.includes(currGenre)) {
					newGenres.push(this.getPrimaryGenre(item.genre));
				}
			});

			let paged;
			const movies = JSON.parse(JSON.stringify(this.props.movieList));
			if (movies.length > PAGE_LENGTH) {
				paged = movies.slice(0, PAGE_LENGTH);
			} else {
				paged = movies;
			}
			this.setState({
				allRecomm: movies,
				genres: newGenres,
				filtered: paged,
				maxPages: Math.ceil(movies.length / PAGE_LENGTH)
			});
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.ratingHistory.length !== this.props.ratingHistory.length) {
			const movies = JSON.parse(JSON.stringify(this.props.movieList));
			if (this.state.selGenre === 'all') {
				this.setState({
					allRecomm: movies,
					filtered: movies.slice(this.state.page * PAGE_LENGTH, (this.state.page + 1) * PAGE_LENGTH)
				});
			} else {
				let newFiltered = [];
				this.props.movieList.forEach(item => {
					if (this.state.selGenre === this.getPrimaryGenre(item.genre)) {
						newFiltered.push(item);
					}
				});
				this.setState({
					allRecomm: movies,
					filtered: newFiltered.slice(this.state.page * PAGE_LENGTH, (this.state.page + 1) * PAGE_LENGTH)
				});
			}
		}
		if (prevState.page !== this.state.page) {
			if (this.state.selGenre === 'all') {
				this.setState({
					filtered: this.state.allRecomm.slice(this.state.page * PAGE_LENGTH, (this.state.page + 1) * PAGE_LENGTH)
				});
			} else {
				let newFiltered = [];
				this.props.movieList.forEach(item => {
					if (this.state.selGenre === this.getPrimaryGenre(item.genre)) {
						newFiltered.push(item);
					}
				});
				this.setState({
					filtered: newFiltered.slice(this.state.page * PAGE_LENGTH, (this.state.page + 1) * PAGE_LENGTH)
				});
			}
		}
	}

	changeRating = (newRating, movieid) => {
		let panelid = this.props.id;
		this.props.ratingHandler(panelid, newRating, movieid);
	}

	onValueChange = (event) => {
		let panelid = this.props.id;
		let movieid = event.target.value;
		this.props.selectionHandler(panelid, movieid);
	}

	onHover = (evt, isShown, activeMovie, action) => {
		let panelid = this.props.id;
		this.props.hoverHandler(isShown, activeMovie, action, panelid);
	}

	onChangeGenre = (event) => {
		const newGenre = event.target.value;
		if (newGenre === "all") {
			const movies = JSON.parse(JSON.stringify(this.props.movieList));
			this.setState({
				filtered: movies.slice(0, PAGE_LENGTH),
				selGenre: 'all',
				page: 0,
				maxPages: Math.ceil(movies.length / PAGE_LENGTH)
			});
		} else {
			let newFiltered = [];
			this.props.movieList.forEach(item => {
				if (newGenre === this.getPrimaryGenre(item.genre)) {
					newFiltered.push(item);
				}
			});
			this.setState({
				filtered: newFiltered.slice(0, PAGE_LENGTH),
				selGenre: newGenre,
				page: 0,
				maxPages: Math.ceil(newFiltered.length / PAGE_LENGTH)
			});
		}
	};

	onPrev = (event) => {
		const newPage = this.state.page - 1;
		this.setState({page: newPage});
	};

	onNext = (event) => {
		const newPage = this.state.page + 1;
		this.setState({page: newPage});
	};

	render() {
		let byline = this.props.panelByline;
		return (
			<div className="col-sm-6 gy-sm-0" id={this.props.id}>
				<div className="align-items-center justify-content-center"
					style={{
						padding: "27px 18px",
						textAlign: "center", borderRadius: "0.3rem 0.3rem 0 0",
						backgroundColor: "#e9ecef"
					}}>
					<h5>{this.props.panelTitle}</h5>
					{byline.length > 0
						? <p style={{ textAlign: "left", fontSize: "14px" }}>
							{this.props.panelByline}
							</p>
						: ''
					}
					<select className="form-select" value={this.state.selGenre} onChange={this.onChangeGenre}>
						<option key="all" value="all">All Genres</option>
						{this.state.genres.map(g => (
							<option key={g} value={g}>{g}</option>
						))}
					</select>
				</div>
				<ListGroup as="ul">
					{this.state.filtered.map((movie) => (
						this.props.render({
							key: movie.movie_id,
							movie: movie,
							selectedid: this.props.selectedid,
							hoverHandler: this.onHover,
							ratingsHandler: this.changeRating,
							selectStateHandler: this.onValueChange
						})
						// <SidePanelItem key={movie.movie_id} movie={movie}
						// 	pick={this.props.pick || false}
						// 	selectedid={this.props.selectedid}
						// 	hoverHandler={this.onHover}
						// 	ratingsHandler={this.changeRating}
						// 	selectStateHandler={this.onValueChange} />
					))}
				</ListGroup>
				<div className="d-flex justify-content-evenly align-items-center pt-2">
					<button
						type="button"
						className="btn btn-primary"
						onClick={this.onPrev}
						disabled={this.state.page <= 0}>
							Previous
					</button>
					{this.state.page + 1} / {this.state.maxPages}
					<button
						type="button"
						className="btn btn-primary"
						onClick={this.onNext}
						disabled={this.state.page + 1 >= this.state.maxPages}>
							Next
					</button>
				</div>
			</div>
		);
	}
}

export default MovieSidePanel