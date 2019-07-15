import React, { Component } from 'react';
import { withCookies } from 'react-cookie'
import Bar from './Bar';
import Footer from './Footer';
import Navigation from './Navigation';
import NewsListing from './NewsListing';

class App extends Component {
  constructor(props) {
      super(props);
      this.state = {
          stories: [],
          newsPerPage: 12,
          totalPages: 1,
      }
  }

  componentDidMount() {
      fetch("/api/homeNews")
          .then(res => {
            if (!res.ok) {
              throw res;
            }
            return res.json()
          })
          .then(data => {
            this.setState({
              stories: data,
              totalPages: Math.ceil(data.length / this.state.newsPerPage)
            });
          })
          .catch(err => {
            console.log("Failed to fetch home new");
          });
  }

  render() {
    return (
      <div className="App">
        <Bar title="NewsWatcher | A sample app by Gan"
             cookies={this.props.cookies}/>
        <Navigation />
        <div className="main-container">
          <NewsListing stories={this.state.stories}
                       newsPerPage={this.state.newsPerPage}
                       totalPages={this.state.totalPages} />
        </div>
        <Footer />
      </div>
    );
  }
}

export default withCookies(App);
