import { Client } from 'paho-mqtt';
import { v4 as uuidv4 } from 'uuid';

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.topics = {
      soilMoisture: 'solo/umidade',
      rainStatus: 'chuva/status',
      temperature: 'ambiente/temperatura',
      humidity: 'ambiente/umidade',
      irrigationStatus: 'irrigacao/status',
      irrigationCommand: 'irrigacao/comando'
    };
    this.callbacks = {};
  }

  // Initialize MQTT client and connect to broker
  connect(brokerUrl = 'ws://localhost:9001', onConnect, onFailure) {
    try {
      // Generate a unique client ID based on timestamp
      const clientId = `irrigation_dashboard_${uuidv4().substring(0, 8)}`;
      
      // Create a client instance
      this.client = new Client(brokerUrl, clientId);
      
      // Set callback handlers
      this.client.onConnectionLost = this.onConnectionLost.bind(this);
      this.client.onMessageArrived = this.onMessageArrived.bind(this);
      
      // Connect the client
      const options = {
        useSSL: false, // Desativa SSL para conexão local
        timeout: 3,
        onSuccess: () => {
          console.log('Connected to MQTT broker');
          this.isConnected = true;
          this.subscribeToTopics();
          if (onConnect) onConnect();
        },
        onFailure: (err) => {
          console.error('Connection to MQTT broker failed:', err.errorMessage);
          this.isConnected = false;
          if (onFailure) onFailure(err);
        }
      };
      
      this.client.connect(options);
    } catch (error) {
      console.error('Error initializing MQTT client:', error);
      if (onFailure) onFailure(error);
    }
  }
  
  // Switch to local broker (useful for development or fallback)
  switchToLocalBroker(localBrokerUrl = 'ws://localhost:9001') {
    if (this.isConnected) {
      this.disconnect();
    }
    this.connect(localBrokerUrl);
  }

  // Disconnect from broker
  disconnect() {
    if (this.client && this.isConnected) {
      this.client.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MQTT broker');
    }
  }

  // Subscribe to all sensor topics
  subscribeToTopics() {
    if (!this.client || !this.isConnected) {
      console.error('Cannot subscribe: MQTT client not connected');
      return;
    }
    
    // Subscribe to each topic
    Object.values(this.topics).forEach(topic => {
      if (topic !== this.topics.irrigationCommand) { // Don't subscribe to command topic
        this.client.subscribe(topic, {
          qos: 0,
          onSuccess: () => console.log(`Subscribed to ${topic}`),
          onFailure: (err) => console.error(`Failed to subscribe to ${topic}:`, err.errorMessage)
        });
      }
    });
  }

  // Register a callback for a specific topic
  on(topic, callback) {
    if (!this.callbacks[topic]) {
      this.callbacks[topic] = [];
    }
    this.callbacks[topic].push(callback);
  }

  // Send command to control irrigation
  sendIrrigationCommand(isOn) {
    if (!this.client || !this.isConnected) {
      console.error('Cannot send command: MQTT client not connected');
      return false;
    }
    
    const payload = JSON.stringify({
      command: isOn ? 'ON' : 'OFF',
      timestamp: new Date().toISOString()
    });
    
    try {
      // Using the client library's Message constructor
      const message = new this.client.Message(payload);
      message.destinationName = this.topics.irrigationCommand;
      message.qos = 1;
      message.retained = false;
      
      this.client.send(message);
      console.log(`Sent irrigation command: ${isOn ? 'ON' : 'OFF'}`);
      return true;
    } catch (error) {
      console.error('Error sending irrigation command:', error);
      return false;
    }
  }

  // Handle connection lost event
  onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.error('Connection lost:', responseObject.errorMessage);
      this.isConnected = false;
    }
  }

  // Handle message arrival
  onMessageArrived(message) {
    const topic = message.destinationName;
    let payload;
    
    try {
      // Try to parse JSON payload
      payload = JSON.parse(message.payloadString);
    } catch {
      // If not JSON, use the raw string
      payload = message.payloadString;
      // If debugging is needed: console.debug('Not a JSON payload');
    }
    
    console.log(`Message received on ${topic}:`, payload);
    
    // Call registered callbacks for this topic
    if (this.callbacks[topic]) {
      this.callbacks[topic].forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in callback for topic ${topic}:`, error);
        }
      });
    }
  }
}

// Create singleton instance
const mqttService = new MQTTService();
export default mqttService;
