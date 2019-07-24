import React, { Component } from 'react';

class NewsBox extends Component {

    render() {
        let date = Date(this.props.date);
        date = date.slice(0, date.indexOf(":") - 3);
        return (
            <div className="masonry__item col-lg-4 col-md-6"
                 data-masonry-filter={ undefined }>
                <article className="feature feature-1">
                    <a href={ this.props.story.link }
                       className="block">
                        <img alt="story cover" src={ this.props.story.imageUrl } />
                    </a>
                    <div className="feature__body boxed boxed--border">
                        <span>{ date }</span>
                        <h5>{ this.props.story.title }</h5>
                        <p> { this.props.story.contentSnippet }</p>
                        <a href={ this.props.story.link }>
                            Read More
                        </a>
                    </div>
                </article>
            </div>
        );
    }
}

export default NewsBox;