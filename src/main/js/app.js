'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const when = require('when');
const client = require('./client');

const follow = require('./follow'); // function to hop multiple links by "rel"

const stompClient = require('./websocket-listener');

const root = '/api';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {users: [], attributes: [], page: 1, pageSize: 2, links: {}};
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
        this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
        this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
    }

    loadFromServer(pageSize) {
        follow(client, root, [
            {rel: 'users', params: {size: pageSize}}]
        ).then(userCollection => {
            return client({
                method: 'GET',
                path: userCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                this.schema = schema.entity;
                this.links = userCollection.entity._links;
                return userCollection;
            });
        }).then(userCollection => {
            this.page = userCollection.entity.page;
            return userCollection.entity._embedded.users.map(user =>
                client({
                    method: 'GET',
                    path: user._links.self.href
                })
            );
        }).then(userPromises => {
            return when.all(userPromises);
        }).done(users => {
            this.setState({
                page: this.page,
                users: users,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: this.links
            });
        });
    }

    // tag::on-create[]
    onCreate(newUser) {
        follow(client, root, ['users']).done(response => {
            client({
                method: 'POST',
                path: response.entity._links.self.href,
                entity: newUser,
                headers: {'Content-Type': 'application/json'}
            })
        })
    }
    // end::on-create[]

    onUpdate(user, updatedUser) {
        client({
            method: 'PUT',
            path: user.entity._links.self.href,
            entity: updatedUser,
            headers: {
                'Content-Type': 'application/json',
                'If-Match': user.headers.Etag
            }
        }).done(response => {
            /* Let the websocket handler update the state */
        }, response => {
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' + user.entity._links.self.href + '. Your copy is stale.');
            }
        });
    }

    onDelete(user) {
        client({method: 'DELETE', path: user.entity._links.self.href});
    }

    onNavigate(navUri) {
        client({
            method: 'GET',
            path: navUri
        }).then(userCollection => {
            this.links = userCollection.entity._links;
            this.page = userCollection.entity.page;

            return userCollection.entity._embedded.users.map(user =>
                client({
                    method: 'GET',
                    path: user._links.self.href
                })
            );
        }).then(userPromises => {
            return when.all(userPromises);
        }).done(users => {
            this.setState({
                page: this.page,
                users: users,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    // tag::websocket-handlers[]
    refreshAndGoToLastPage(message) {
        follow(client, root, [{
            rel: 'users',
            params: {size: this.state.pageSize}
        }]).done(response => {
            if (response.entity._links.last !== undefined) {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        })
    }

    refreshCurrentPage(message) {
        follow(client, root, [{
            rel: 'users',
            params: {
                size: this.state.pageSize,
                page: this.state.page.number
            }
        }]).then(userCollection => {
            this.links = userCollection.entity._links;
            this.page = userCollection.entity.page;

            return userCollection.entity._embedded.users.map(user => {
                return client({
                    method: 'GET',
                    path: user._links.self.href
                })
            });
        }).then(userPromises => {
            return when.all(userPromises);
        }).then(users => {
            this.setState({
                page: this.page,
                users: users,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }
    // end::websocket-handlers[]

    // tag::register-handlers[]
    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
        stompClient.register([
            {route: '/topic/newUser', callback: this.refreshAndGoToLastPage},
            {route: '/topic/updateUser', callback: this.refreshCurrentPage},
            {route: '/topic/deleteUser', callback: this.refreshCurrentPage}
        ]);
    }
    // end::register-handlers[]

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <UserList page={this.state.page}
                              users={this.state.users}
                              links={this.state.links}
                              pageSize={this.state.pageSize}
                              attributes={this.state.attributes}
                              onNavigate={this.onNavigate}
                              onUpdate={this.onUpdate}
                              onDelete={this.onDelete}
                              updatePageSize={this.updatePageSize}/>
            </div>
        )
    }
}

class CreateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        const newUser = {};
        this.props.attributes.forEach(attribute => {
            newUser[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newUser);
        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = ''; // clear out the dialog's inputs
        });
        window.location = "#";
    }

    render() {
        const inputs = this.props.attributes.map(attribute =>
            <p key={attribute}>
                <input type="text" placeholder={attribute} ref={attribute} className="field"/>
            </p>
        );
        return (
            <div>
                <a href="#createUser">Create</a>

                <div id="createUser" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Create new user</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

class UpdateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        const updatedUser = {};
        this.props.attributes.forEach(attribute => {
            updatedUser[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onUpdate(this.props.user, updatedUser);
        window.location = "#";
    }

    render() {
        const inputs = this.props.attributes.map(attribute =>
            <p key={this.props.user.entity[attribute]}>
                <input type="text" placeholder={attribute}
                       defaultValue={this.props.user.entity[attribute]}
                       ref={attribute} className="field"/>
            </p>
        );

        const dialogId = "updateUser-" + this.props.user.entity._links.self.href;

        return (
            <div>
                <a href={"#" + dialogId}>Update</a>

                <div id={dialogId} className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Update an user</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Update</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

}

class UserList extends React.Component {

    constructor(props) {
        super(props);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        e.preventDefault();
        const pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value = pageSize.substring(0, pageSize.length - 1);
        }
    }

    handleNavFirst(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }

    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }

    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }

    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

    render() {
        const pageInfo = this.props.page.hasOwnProperty("number") ?
            <h3>Users - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;

        const users = this.props.users.map(user =>
            <User key={user.entity._links.self.href}
                      user={user}
                      attributes={this.props.attributes}
                      onUpdate={this.props.onUpdate}
                      onDelete={this.props.onDelete}/>
        );

        const navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
                {pageInfo}
                <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
                <table>
                    <tbody>
                    <tr>
                        <th>User Name</th>
                        <th>Real Name</th>
                        <th>Location</th>
                        <th></th>
                        <th></th>
                    </tr>
                    {users}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
        )
    }
}

class User extends React.Component {

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.user);
    }

    render() {
        return (
            <tr>
                <td>{this.props.user.entity.userName}</td>
                <td>{this.props.user.entity.realName}</td>
                <td>{this.props.user.entity.location}</td>
                <td>
                    <UpdateDialog user={this.props.user}
                                  attributes={this.props.attributes}
                                  onUpdate={this.props.onUpdate}/>
                </td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('react')
)