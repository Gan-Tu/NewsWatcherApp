import React, { Component } from 'react';

class Dropdown extends Component {
    render() {
        return (
            <li className="dropdown">
                <span className="dropdown__trigger">{this.props.triggerText}</span>
                <div className="dropdown__container">
                    <div className="container">
                        <div className="row">
                            { this.props.children }
                        </div>
                    </div>
                </div>
            </li>
        );
    }
}

export default Dropdown;

