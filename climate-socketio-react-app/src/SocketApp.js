import React, { Component } from 'react';
import io from 'socket.io-client';
import Gauge from './Gauge';

// Connect to server
let socket = io();

class SocketApp extends Component {

  constructor() {
    super()

    this.state = {
      thermometer: null,
      hygrometer: null
    }

    socket.on('report', data => {
      this.setState({
        thermometer: data.thermometer,
        hygrometer: data.hygrometer
      })
    });
  }

  render() {
    return (
      <div>
        <Gauge value={this.state.thermometer} color="lightgreen" width={400} height={320} label="Temperature in °C" max={50}/>
        <Gauge value={this.state.hygrometer} color="lightblue" width={400} height={320} label="Humidity in %" />
      </div>
    );
  }
}

export default SocketApp;