import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { BarChart, Bar, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axios from 'axios';

class SearchAndDisplayRepos extends React.Component {

    constructor(props) {
        super(props);
        this.changeOrg = this.changeOrg.bind(this);
        this.changeRepo = this.changeRepo.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = { org: '', repo: '', issues: [] };
    }


    changeOrg(newOrg) {
        this.setState({
            org: newOrg
        });
    }
    changeRepo(newRepo) {
        this.setState({
            repo: newRepo
        });
    }

    handleSubmit = async() => {
        try {
            let resp = await axios.post( 'http://localhost:3000/standard', `{ "org": "${this.state.org}", "repo": "${this.state.repo}", "query": "{ repository(owner: \\"${this.state.org}\\", name: \\"${this.state.repo}\\") { issues(first: 50) { edges { node { id number title bodyText } } } } }" }`, {
                headers: { 'Content-Type': 'text/plain' }
            });
            this.setState( { issues: resp.data.repository.issues.edges } );
        } catch(e) {
            //handle error with pretty message
            console.log(e);
            alert("Couldn't find that repo. Please check & try again!");
        }
        
        return;
    }

    render() {
        return [
            <IssueSearch key='search' onChangeOrg={this.changeOrg} onChangeRepo={this.changeRepo} onSubmitSearchQuery={this.handleSubmit} org={this.state.org} repo={this.state.repo}/>,
            <IssueOverviewGraph key='graph' issues={this.state.issues} />,
            <IssueResults key='results' org={this.state.org} repo={this.state.repo} issues={this.state.issues}/>
        ];
    }
}

class IssueSearch extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleOrgChange = this.handleOrgChange.bind(this);
        this.handleRepoChange = this.handleRepoChange.bind(this);
    }

    handleOrgChange(e) {
        this.props.onChangeOrg(e.target.value);
    }
    handleRepoChange(e) {
        this.props.onChangeRepo(e.target.value);
    }

    handleSubmit(e) {
        e.preventDefault();
        this.props.onSubmitSearchQuery(e.target.value);
    }

    render() {
        return (
            <div id='searchBox'>
                <svg className="octicon octicon-repo" viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true"><path fillRule="evenodd" d="M4 9H3V8h1v1zm0-3H3v1h1V6zm0-2H3v1h1V4zm0-2H3v1h1V2zm8-1v12c0 .55-.45 1-1 1H6v2l-1.5-1.5L3 16v-2H1c-.55 0-1-.45-1-1V1c0-.55.45-1 1-1h10c.55 0 1 .45 1 1zm-1 10H1v2h2v-1h3v1h5v-2zm0-10H2v9h9V1z"></path></svg> 
                <form onSubmit={this.handleSubmit}>
                    <input type="text" placeholder='org' value={this.props.org} onChange={this.handleOrgChange} /> / <input type="text" placeholder='repo' value={this.props.repo} onChange={this.handleRepoChange}/>
                    <input type="submit" value="Submit" />
                </form>
            </div>
        );
    }
}

class IssueOverviewGraph extends React.Component {
    
    render() {
        const issues = this.props.issues;
        let graphData = [];
        if( issues.length ) {
            for( let i = issues.length - 1; i >= 0; i-- ) {
                graphData.push( { 'name': issues[i]['node']['number'], 'polarity': issues[i]['node']['sentiment']['polarity'] } );
            }        
        }
        
        return (
            <BarChart width={800} height={300} data={graphData} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="name"/>
                <YAxis/>
                <Tooltip/>
                <Legend />
                <ReferenceLine y={0} stroke='#000'/>
                <Bar dataKey="polarity" fill="#0366d6" />
            </BarChart>
        );
    }
}

class IssueResults extends React.Component {

    getIssueEmoji( polarity ) {
        polarity = polarity.toString();
        const emojiRanking = {
            "5": "😂",
            "4": "😁",
            "3": "😃",
            "2": "😏",
            "1": "🙂",
            "0": "😐",
            "-1": "🤔",
            "-2": "😕",
            "-3": "😬",
            "-4": "😱",
            "-5": "😠"
        };
        
        if( Object.keys(emojiRanking).includes(polarity) ) {
            return emojiRanking[polarity];
        } else {
            return ( polarity > 5 ) ? emojiRanking['5'] : emojiRanking['-5'];
        }
    }
   
    render() {
        const issues = this.props.issues;

        if( issues.length ) {
            
            const issuesCards = issues.map((issue) =>
                <div className='issueItem' key={issue.node.id}>
                    <div className='issueNumber'>
                        <p><a href={'https://github.com/' + this.props.org + '/' + this.props.repo + '/issues/' + issue.node.number} target='_blank'>{issue.node.number}</a></p>
                    </div>
                    <div className='issueBody'>
                        <p className='title'>{issue.node.title}</p>
                        <p className='body'>{issue.node.bodyText.substr(0,200)}</p>
                    </div>
                    <div className='issueSent'>
                        <p>{this.getIssueEmoji(issue.node.sentiment.polarity)}</p>
                    </div>
                </div>
            );

            return (
                <div id='issueList'>{issuesCards}</div>
            );
        } else {
            return (
                <div id='issueList'><p>No issues to show.</p></div>
            );
        }
    }
}

class AppHeader extends React.Component {
    render() {
        return (
            <header>
                <h1>superfly sentiment</h1>
            </header>
        );
    }
}

class SentimentApp extends React.Component {
    render() {
        return [
            <AppHeader key='topbar' />,
            <SearchAndDisplayRepos key='mainbody' />
        ];
    }
}

// ========================================

ReactDOM.render(
    <SentimentApp />,
    document.getElementById('root')
);
