import React, { Component } from 'react';

class Socicon extends Component {
    render() {
        return (
            <a href={this.props.link ? this.props.link : "#"}>
                <i className={"socicon icon icon--xs socicon-" + this.props.icon}></i>
            </a>
        );
    }
}

export default Socicon;