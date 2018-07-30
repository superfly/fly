import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import axios from 'axios';
import cookie from 'react-cookie/build/cookie';

class AppHeader extends React.Component {
    render() {
        return (
            <header>
                <svg className="octicon octicon-repo" viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true"><path fillRule="evenodd" d="M4 9H3V8h1v1zm0-3H3v1h1V6zm0-2H3v1h1V4zm0-2H3v1h1V2zm8-1v12c0 .55-.45 1-1 1H6v2l-1.5-1.5L3 16v-2H1c-.55 0-1-.45-1-1V1c0-.55.45-1 1-1h10c.55 0 1 .45 1 1zm-1 10H1v2h2v-1h3v1h5v-2zm0-10H2v9h9V1z"></path></svg> 
                <p><a href='https://github.com/m52go' target='_blank'>m52go</a> / <a href='https://github.com/m52go/fly-fakeissues' target='_blank'>fly-fakeissues</a></p>
            </header>
        );
    }
}

class RepoActions extends React.Component {
    
    constructor(props) {
        super(props);
        this.openGHAuth = this.openGHAuth.bind(this);
        this.signOut = this.signOut.bind(this);
        this.state = { ghToken: "" };
    }

    componentWillMount() {
        let ghCookie = cookie.load('gh_user_token');
        this.setState({
            ghToken: ( ghCookie ? ghCookie : "" )
        });
    }

    openGHAuth(e) {
        window.open( 'https://github.com/login/oauth/authorize?client_id=1a3c9f7c3a79fc00c399&scope=repo', 'ghlogin', 'width=800,height=450' );
        return;
    }

    signOut(e) {
        let ghCookie = cookie.remove('gh_user_token');
        this.setState({
            ghToken: ( ghCookie ? ghCookie : "" )
        });
        return;
    }

    render() {

        if( this.state.ghToken ) {
            return (
                <div id='actions'>
                    <p>Post an issue below, and <a href='https://github.com/m52go/fly-fakeissues/issues' target='_blank'>see it live here!</a></p>
                    <button onClick={this.signOut}>Sign out</button>
                </div>
            );
        } else {
            return (
                <div id='actions'>
                    <p>Sign in with GitHub to post an issue.</p>
                    <button onClick={this.openGHAuth}>Sign in</button>
                </div>
            );
        }
    }
}

class IssueForm extends React.Component {
    
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleExpectedBehaviorChange = this.handleExpectedBehaviorChange.bind(this);
        this.handleActualBehaviorChange = this.handleActualBehaviorChange.bind(this);
        this.handleStepsChange = this.handleStepsChange.bind(this);
        this.handleVersionChange = this.handleVersionChange.bind(this);
        this.handlePlatformChange = this.handlePlatformChange.bind(this);
        this.handleNodeChange = this.handleNodeChange.bind(this);
        
        this.addMarkdownMarkup = this.addMarkdownMarkup.bind(this);

        this.state = { issueTitle: "", expectedBehavior: "", actualBehavior: "", stepsToReproduce: "", version: "", platform: "", nodeVersion: "", userLoggedIn: false, serverError: false };
    }

    handleTitleChange(e) {
        this.setState( { issueTitle: e.target.value } );
    }
    handleExpectedBehaviorChange(e) {
        this.setState( { expectedBehavior: e.target.value } );
    }
    handleActualBehaviorChange(e) {
        this.setState( { actualBehavior: e.target.value } );
    }
    handleStepsChange(e) {
        this.setState( { stepsToReproduce: e.target.value } );
    }
    handleVersionChange(e) {
        this.setState( { version: e.target.value } );
    }
    handlePlatformChange(e) {
        this.setState( { platform: e.target.value } );
    }
    handleNodeChange(e) {
        this.setState( { nodeVersion: e.target.value } );
    }

    addMarkdownMarkup() {
        return { "title": this.state.issueTitle, "body": "## Expected Behavior \n\n" + this.state.expectedBehavior + "\n\n" +
                                                         "## Actual Behavior \n\n" + this.state.actualBehavior + "\n\n" +
                                                         "#### Package Version \n" + this.state.version + "\n\n" +
                                                         "#### Platform \n" + this.state.platform + "\n\n" +
                                                         "#### Node Version \n" + this.state.nodeVersion + "\n\n"
                    
        };
    }

    async handleSubmit(e) {
        e.preventDefault();

        //check if user is logged in
        if( !cookie.load('gh_user_token') ) {
            this.setState( { userLoggedIn: true, serverError: false } );
            return;
        }

        const issueWithMarkdown = this.addMarkdownMarkup();
        
        try {
            let resp = await axios.post( 'https://api.github.com/repos/m52go/fly-fakeissues/issues', issueWithMarkdown, {
                headers: { 'Content-Type': 'application/json', 
                           'Authorization': 'Bearer ' + cookie.load('gh_user_token') }
            });
            this.setState( { userLoggedIn: false, serverError: false } );
        } catch(e) {
            this.setState( { userLoggedIn: false, serverError: true } );
        }
    }

    render() {

        const enableSubmit = ( this.state.expectedBehavior.length > 0 ) && ( this.state.actualBehavior.length > 0 ) &&
                             ( this.state.stepsToReproduce.length > 0 ) && ( this.state.version.length > 0 ) && 
                             ( this.state.platform.length > 0 ) && ( this.state.nodeVersion.length > 0 );

        let errorMessage = "";
        if( this.state.userLoggedIn ) {
            errorMessage = "<p class='error not-signed-in'>Can't do that—you're not signed in!</p>";
        } else if( this.state.serverError ) {
            errorMessage = "<p class='error server-error'>Error submitting your issue. Please try again.</p>";
        }

        return (
            <form onSubmit={this.handleSubmit}>
                <h2>Your Issue</h2>
                <label>Title
                    <input type='text' value={this.state.issueTitle} onChange={this.handleTitleChange} placeholder="Describe the issue using as close to 100 characters as you can."/>
                </label>
                <label>Expected Behavior
                    <textarea value={this.state.expectedBehavior} onChange={this.handleExpectedBehaviorChange} placeholder='What did you expect to happen?'/>
                </label>
                <label>Actual Behavior
                    <textarea value={this.state.actualBehavior} onChange={this.handleActualBehaviorChange} placeholder='What actually happened?' />
                </label>
                <label>Steps to Reproduce
                    <textarea value={this.state.stepsToReproduce} onChange={this.handleStepsChange} placeholder='Please provide a detailed, ordered list (1, 2, 3...).' />
                </label>
                <h2>Your Environment</h2>
                <label>Version
                    <input type='text' value={this.state.version} onChange={this.handleVersionChange} placeholder="Version of the package your're using." />
                <label>Platform
                </label>
                    <input type='text' value={this.state.platform} onChange={this.handlePlatformChange} placeholder="Mac, Windows, etc. Build version ideal." />
                </label>
                <label>Node Version
                    <input type='text' value={this.state.nodeVersion} onChange={this.handleNodeChange} placeholder="Version of Node you're running."/>
                </label>
                
                <div style={{textAlign: 'center'}}>
                    <input type="submit" value="Submit" disabled={!enableSubmit} />
                </div>

                <div dangerouslySetInnerHTML={{__html: errorMessage}} />

            </form>
        );
    }
}

class GitHubAuth extends React.Component {
    render() {
        return [
            <AppHeader key='topbar' />,
            <RepoActions key='signin' />,
            <IssueForm key='issueform' />
        ];
    }
}

// ========================================

ReactDOM.render(
    <GitHubAuth />,
    document.getElementById('root')
);
