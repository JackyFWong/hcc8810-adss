import axios from "axios";
import React, { Component } from 'react';
import { Button, Card, Container, Spinner } from "react-bootstrap";
import { Navigate, Redirect } from "react-router-dom";
import { API } from "../utils/constants";
import LoadingAnimation from '../widgets/loadingView';
import MovieSidePanel from "../widgets/movieSidePanel";
import { Steps } from "intro.js-react";
import 'intro.js/introjs.css';
import SidePanelItemRate from "../widgets/movieSidePanelItemRate";
import withRouter from "../hooks/withRouter";


class RecommendationPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            ready: false,
            panel: { items: [], condition: '', byline: '', tag: '', vstd: [] },
            visited: [],
            ratingHistory: [],
            setIsShown: false,
            activeMovie: null,
            pick: this.props.pick || false,
            recDateTime: new Date(),
            pageid: this.props.router.location.state.pageid + 1,
            ratings: this.props.router.location.state.ratings,
            userid: this.props.router.location.state.userid,
            updateSuccess: false,
            selection: {},
            hoverHistory: [],
            loading: false,
            stepsEnabled: true,
            initialStep: 0,
            steps: [
                {
                    element: ".jumbotron",
                    intro: this.props.headerSubtitle
                },
                {
                    element: "#panel",
                    intro: "These are your movie recommendations.",
                    position: "right"
                },
                {
                    element: "#moviePosterPreview",
                    intro: "You can hover over movies to see a preview of the poster and a short synopsis."
                },
                {
                    element: '.next-button',
                    intro: this.props.finalhint
                }
            ],
        };
        this.handleHover = this.handleHover.bind(this);
        this.handleRating = this.handleRating.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.updateSurvey = this.updateSurveyResponse.bind(this);
    }

    componentDidMount() {
        this.props.toggleLoader(true);
        this.getRecommendations();
        this.startTimer();
        if (this.state.pick) {
            document.body.style.backgroundColor = "blanchedalmond";
        }
    }

    componentWillUnmount() {
        document.body.style.backgroundColor = "white";
    }

    getRecommendations() {
        let userid = this.state.userid;
        let ratings = this.state.ratings;

        axios.post(API + 'recommendations', {
            userid: userid,
            ratings: ratings,
            count: 7
        },
            {
                headers: {
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Allow-Origin': '*'
                }
            })
            .then(response => {
                if (response.status === 200) {
                    console.log(response.data)
                    const combinedResp = JSON.parse(JSON.stringify(response.data['recommendations']['combined']))
                    this.setState({
                        panel: {
                            tag: combinedResp['tag'],
                            condition: combinedResp['label'],
                            byline: combinedResp['byline'],
                            items: combinedResp['items'],
                            vstd: []
                        }
                    });
                }
            });
    }

    async startTimer() {
        await this.wait(10000);
        this.setState({
            ready: true
        });
        this.props.toggleLoader(false);
    }

    wait(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }

    updateSurveyResponse() {
        this.setState({
            loading: true
        });

        let recDateTime = this.state.recDateTime;
        let recEndTime = new Date();
        let pageid = this.state.pageid;
        let userid = this.state.userid;
        let ratedLst = this.state.visited;
        let hoverHistory = this.state.hoverHistory;
        let ratingHistory = this.state.ratingHistory;

        axios.put(API + 'add_survey_response', {
            pageid: pageid,
            userid: userid,
            starttime: recDateTime.toUTCString(),
            endtime: recEndTime.toUTCString(),
            response: {
                ratings: ratedLst,
                rating_history: ratingHistory,
                hover_history: hoverHistory
            }
        })
            .then(response => {
                if (response.status === 200) {
                    this.setState({
                        updateSuccess: true,
                        loading: false
                    });
                }
                this.props.progressUpdater(10);
            })
    }

    handleHover(isShown, activeMovie, action, panelid) {
        let history = [...this.state.hoverHistory];
        let panel = this.state[panelid];
        history.push({
            'item_id': activeMovie.movie_id,
            time: new Date().toUTCString(),
            action: action,
            loc: panel.tag,
            level: this.props.level

        });
        this.setState({
            setIsShown: isShown,
            activeMovie: activeMovie,
            hoverHistory: history
        });
    }

    /**
     * TODO Split up the vstdLst into separate list to keep track
     * Update rating on each panel separately
     * @param {string} panelid refers to the id of the MovieSidePanel for callback
     * @param {int} newRating the user updated rating for a movie
     * @param {string} movieid the id of the movie to be updated
     */
    handleRating(panelid, newRating, movieid) {
        let panel = this.state[panelid];
        let movieLst = [...panel.items];
        let vstdLst = [...this.state.visited];
        let panelvstd = [...panel.vstd];
        let ratedItm = movieLst.map(movie => (
            movie.movie_id === movieid ? {
                ...movie, rating: newRating
            } : movie
        ));

        let ratingHistory = [...this.state.ratingHistory];
        let rated = {
            item_id: movieid,
            rating: newRating,
            rating_date: new Date().toUTCString(),
            loc: panel.tag,
            level: this.props.level
        };
        ratingHistory.push(rated);
        if (!panelvstd.some(itemid => itemid === movieid)) panelvstd.push(movieid);

        let isNew = !vstdLst.some(item => item.item_id === movieid);
        if (isNew) {
            vstdLst.push(rated);

        } else {
            vstdLst = vstdLst.map(movie => (
                movie.item_id === movieid ? {
                    ...movie,
                    rating: newRating,
                    rating_date: new Date().toUTCString()
                } : movie
            ));
        }
        panel.items = ratedItm;
        panel.vstd = panelvstd;
        this.setState({
            panelid: panel,
            visited: vstdLst,
            ratingHistory: ratingHistory
        });
    }

    handleSelect(panelid, movieid) {
        let panel = this.state[panelid];
        let ratingHistory = [...this.state.ratingHistory];
        let rated = {
            item_id: movieid,
            rating: 99,
            rating_date: new Date().toUTCString(),
            loc: panel.tag,
            level: this.props.level
        };
        ratingHistory.push(rated);

        this.setState({
            selectedid: movieid,
            ratingHistory: ratingHistory
        });
    }

    onBeforeChange = nextStepIndex => {
        if (nextStepIndex === 1) {
            this.steps.updateStepElement(nextStepIndex);
        }
    }

    onExit = () => {
        this.setState(() => ({ stepsEnabled: false }));
    };

    render() {
        let pick = this.state.pick;
        let selectedid = this.state.selectedid;

        let userid = this.state.userid;
        let pageid = this.state.pageid;

        let items = this.state.panel.items;
        let condition = this.state.panel.condition;
        let byline = this.state.panel.byline;
        let vstd = this.state.panel.vstd;

        const dest = this.props.dest;

        if (this.state.updateSuccess) {

            let ratings = this.state.visited.concat(this.state.ratings);
            let selectedmovie = items.find((movie) => (
                movie.movie_id === selectedid
            ));
            return (
                <Navigate to={dest} state={
                    {
                        userid: userid,
                        ratings: ratings,
                        recs: items,
                        pageid: pageid,
                        selectedmovie: selectedmovie
                    }
                }
                />
            );
        }

        let buttonDisabled = ((items.length) !==
            vstd.length) && selectedid === undefined;

        let buttonVariant = buttonDisabled ? 'secondary' : 'primary';

        const {
            stepsEnabled,
            steps,
            initialStep,
        } = this.state;

        return this.state.ready ? (
            <>
                <Steps
                    enabled={stepsEnabled}
                    steps={steps}
                    initialStep={initialStep}
                    onExit={this.onExit}
                    options={{
                        showStepNumbers: true,
                        scrollToElement: true,
                        hideNext: false,
                        nextToDone: true
                    }}
                    ref={steps => (this.steps = steps)}
                    onBeforeChange={this.onBeforeChange}
                />
                <div className="jumbotron">
                    <h1 className="header">{this.props.pageHeader}</h1>
                    <p>{this.props.headerSubtitle}
                    </p>
                </div>

                <div className="row g-0 justify-content-center">
                    {/* <MovieSidePanel id="leftPanel"
                        movieList={leftItems}
                        hoverHandler={this.handleHover}
                        ratingHandler={this.handleRating}
                        panelTitle={leftCondition}
                        pick={pick}
                        selectionHandler={this.handleSelect}
                        selectedid={selectedid}
                        panelByline={leftbyline}
                    /> */}
                    <MovieSidePanel id="panel" movieList={items}
                        panelTitle={condition}
                        panelByline={byline}
                        render={(props) => <SidePanelItemRate {...props} />}
                        hoverHandler={this.handleHover}
                        ratingHandler={this.handleRating}
                        ratingHistory={this.state.ratingHistory}
                    />
                    <div className="col-sm-4 gx-sm-4" id="moviePosterPreview">
                        {this.state.setIsShown && (this.state.activeMovie != null) ? (
                            <Card bg="dark" text="white" style={{
                                backgroundColor: '#333', borderColor: '#333'
                            }}>
                                <Card.Body style={{ height: '700px' }}>
                                    <Card.Img variant="top" className="d-flex mx-auto d-block img-thumbnail"
                                        src={this.state.activeMovie.poster} alt={"Poster of the movie " +
                                            this.state.activeMovie.title}
                                        style={{ maxHeight: "63%", minHeight: "63%", width: "auto" }} />
                                    <Card.Title style={{ marginTop: "0.5rem" }}>
                                        {this.state.activeMovie.title}
                                    </Card.Title>
                                    <Container className="overflow-auto" style={{ height: "30%" }}>
                                        <Card.Text>
                                            <h6>{this.state.activeMovie.genre.split('|')[0]}</h6>
                                            {this.state.activeMovie.description}
                                        </Card.Text>
                                    </Container>
                                </Card.Body>
                            </Card>
                        ) : (<div style={{ height: "700px" }} />)
                        }
                    </div>
                    {/* <MovieSidePanel id="rightPanel"
                        movieList={rightItems}
                        hoverHandler={this.handleHover}
                        ratingHandler={this.handleRating}
                        panelTitle={rightCondition}
                        pick={pick}
                        selectionHandler={this.handleSelect}
                        selectedid={selectedid}
                        panelByline={rightbyline}
                    /> */}
                    {/* <MovieSidePanel id="rightPanel" movieList={rightItems}
                        panelTitle={rightCondition}
                        panelByline={rightbyline}
                        render={(props) => <SidePanelItemRate {...props} />}
                        hoverHandler={this.handleHover}
                        ratingHandler={this.handleRating}
                    /> */}
                </div>
                <div className="jumbotron jumbotron-footer">
                    <Button className="next-button footer-btn" variant={buttonVariant} size="lg"
                        disabled={buttonDisabled && !this.state.loading}
                        onClick={this.updateSurvey}>
                        {!this.state.loading ? 'Next'
                            :
                            <>
                                <Spinner
                                    as="span"
                                    animation="grow"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                />
                                Loading...
                            </>
                        }
                    </Button>
                </div>
            </>
        ) :
            (
                <>
                    <LoadingAnimation waitMsg={this.props.waitMsg}></LoadingAnimation>
                </>
            );
    }
}

export default withRouter(RecommendationPage);