import React, { Component } from 'react';
import Pagination from './components/Pagination';
import NewsBox from './components/NewsBox';

class NewsListing extends Component {

  constructor(props) {
      super(props);
      this.state = {
        page: 1,
        renderFooter: false
      };
  }

  handleChangePage = (selectedPage) => {
    this.setState({
      page: selectedPage
    });
  }

  render() {
    let endIndex = this.props.newsPerPage * this.state.page;
    let startIndex = Math.max(0, endIndex - this.props.newsPerPage);
    let stories = this.props.stories.slice(startIndex, endIndex)
                                    .map(story => {
                                        return <NewsBox story={story}
                                                        key={story.storyID}/>;
                                    });
    return (
      <section className="space--sm">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="row">
                  { stories }
              </div>
              <Pagination start={1}
                          dataLoaded={ this.props.dataLoaded }
                          end={ this.props.totalPages }
                          current={this.state.page}
                          handleChangePage={ this.handleChangePage }/>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default NewsListing;