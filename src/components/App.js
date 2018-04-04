import React from 'react';
import TransitionGroup from 'react-transition-group/TransitionGroup';
import { Route, Switch, BrowserRouter, Redirect } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import NotFound from './NotFound';
import Business from './Business';
import Review from './Review';
import Home from './Home';
import '../static/App.css';

class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <div id="app">
          <Header />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/review/:reviewId" component={Review} />
            <Route path="/reviews" component={Review} />
            <Route path="/business/:businessId" component={Business} />
            <Route path="/businesses" component={Review} />
            <Route path="/404" component={NotFound} />
            <Redirect from="*" to="/404" />
          </Switch>
          <Footer />
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
