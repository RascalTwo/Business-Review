import React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Route, Switch, BrowserRouter, Redirect } from 'react-router-dom';
import { PropTypes, businessShape } from '../proptypes';
import Header from './Header';
import Footer from './Footer';
import NotFound from './NotFound';
import Business from './Business';
import Businesses from './Businesses';
import Review from './Review';
import Reviews from './Reviews';
import Home from './Home';
import '../static/App.css';

class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <Route
          render={({ location }) => (
            <div id="app">
              <Header />
              <TransitionGroup component="div" className="route-transition">
                <CSSTransition
                  key={location.key}
                  classNames="fade"
                  timeout={{
                    enter: 800,
                    exit: 150
                  }}
                >
                  <Switch key={location.pathname} location={location}>
                    <Route exact path="/" component={Home} />
                    <Route
                      path="/review/:reviewId"
                      component={(path) => {
                        const targetId = path.match.params.reviewId;
                        const reviews = this.props.payload.reduce(
                          (array, business) => array.concat(business.reviews),
                          []
                        );
                        const review = reviews.find(loopReview => loopReview.id === Number(targetId));
                        if (!review) return <NotFound />;

                        return <Review {...review} />;
                      }}
                    />
                    <Route
                      path="/reviews"
                      component={() => {
                        const reviews = this.props.payload.reduce(
                          (array, business) => array.concat(business.reviews),
                          []
                        );
                        reviews.sort((a, b) => b.date - a.date);
                        return <Reviews items={reviews} />;
                      }}
                    />
                    <Route
                      path="/business/:businessId"
                      component={(path) => {
                        const targetId = path.match.params.businessId;
                        const business = this.props.payload.find(loopBusiness => loopBusiness.id === Number(targetId));
                        if (!business) return <NotFound />;

                        return <Business {...business} />;
                      }}
                    />
                    <Route
                      path="/businesses"
                      component={() => (
                        <Businesses items={this.props.payload} />
                      )}
                    />
                    <Route
                      path="/user/:userId"
                      component={(path) => {
                        const targetId = path.match.params.userId;
                        const reviews = this.props.payload.reduce(
                          (array, business) => array.concat(business.reviews),
                          []
                        );
                        const review = reviews.find(loopReview => loopReview.id === Number(targetId));
                        if (!review) return <NotFound />;

                        return <Review {...review} />;
                      }}
                    />
                    <Route path="/404" component={NotFound} />
                    <Redirect from="*" to="/404" />
                  </Switch>
                </CSSTransition>
              </TransitionGroup>

              <Footer />
            </div>
          )}
        />
      </BrowserRouter>
    );
  }
}

App.propTypes = PropTypes.arrayOf(businessShape).isRequired;

export default App;
