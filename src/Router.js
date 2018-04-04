import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import App from './app';
import Payload from './payload';
import photoMap from './photoMap';
import NotFound from './NotFound';
import Business from './Business';
import Review from './Review';

const testProp = [1, 2, 3];

const Router = () => (
  <BrowserRouter>
    <Switch>
      <Route
        exact
        path="/"
        render={() => <App payload={Payload} photoMap={photoMap} test={testProp} />}
      />
      <Route
        path="/business/:businessId"
        component={Business}
      />
      <Route
        path="/review/:reviewId"
        component={Review}
      />
      <Route component={NotFound} />
    </Switch>
  </BrowserRouter>
);

export default Router;
