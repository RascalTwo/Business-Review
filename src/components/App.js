import React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Route, Switch, BrowserRouter, Redirect } from 'react-router-dom';
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
              <div className="min-height">
                <TransitionGroup component={null}>
                  <CSSTransition
                    key={location.key}
                    classNames="fade"
                    timeout={{
                      enter: 800,
                      exit: 150
                    }}
                    onExited={() => {
                      console.log('exited');
                    }}
                    onEntered={() => {
                      console.log('entered');
                    }}
                  >
                    <Switch key={location.pathname} location={location}>
                      <Route exact path="/" component={Home} />
                      <Route path="/review/:reviewId" component={Review} />
                      <Route path="/reviews" component={Reviews} />
                      <Route
                        path="/business/:businessId"
                        component={Business}
                      />
                      <Route path="/businesses" component={Businesses} />
                      <Route path="/404" component={NotFound} />
                      <Redirect from="*" to="/404" />
                    </Switch>
                  </CSSTransition>
                </TransitionGroup>
              </div>
              <Footer />
            </div>
          )}
        />
      </BrowserRouter>
    );
  }
}

export default App;
