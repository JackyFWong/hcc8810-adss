import React, { Component } from "react";
import { ListGroup } from "react-bootstrap";

class MovieSidePanel extends Component {

	constructor(props) {
		super(props);

		this.state = {
			allRecomm: [],
			genres: [],
			selGenre: 'all',
			filtered: [],
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
			this.setState({
				allRecomm: JSON.parse(JSON.stringify(this.props.movieList)),
				genres: newGenres,
				filtered: JSON.parse(JSON.stringify(this.props.movieList))
			});
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.ratingHistory.length !== this.props.ratingHistory.length) {
			if (this.state.selGenre === 'all') {
				this.setState({
					allRecomm: JSON.parse(JSON.stringify(this.props.movieList)),
					filtered: JSON.parse(JSON.stringify(this.props.movieList))
				});
			} else {
				let newFiltered = [];
				this.props.movieList.forEach(item => {
					if (this.state.selGenre === this.getPrimaryGenre(item.genre)) {
						newFiltered.push(item);
					}
				});
				this.setState({
					allRecomm: JSON.parse(JSON.stringify(this.props.movieList)),
					filtered: newFiltered
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
			this.setState({
				filtered: JSON.parse(JSON.stringify(this.props.movieList)),
				selGenre: 'all'
			});
		} else {
			let newFiltered = [];
			this.props.movieList.forEach(item => {
				if (newGenre === this.getPrimaryGenre(item.genre)) {
					newFiltered.push(item);
				}
			});
			this.setState({
				filtered: newFiltered,
				selGenre: newGenre
			});
		}
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
			</div>
		);
	}
}

export default MovieSidePanel