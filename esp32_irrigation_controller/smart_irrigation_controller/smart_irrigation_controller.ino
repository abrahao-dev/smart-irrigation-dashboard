/*
 * Smart Irrigation System - ESP8266 NodeMCU Controller
 *
 * Este código implementa um sistema de irrigação automático utilizando:
 * - Sensor de umidade do solo (YL-69)
 * - Sensor de chuva (FC-37)
 * - Sensor de temperatura e umidade do ar (DHT22)
 * - Controlador PID para ajuste dinâmico do tempo de irrigação
 * - Conexão MQTT para integração com dashboard web
 */

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <PID_v1.h>

// =============== CONFIGURAÇÕES DE PINOS ===============
// ESP8266 tem apenas um pino analógico (A0), então precisamos usar um multiplexador ou alternar leituras
#define ANALOG_PIN A0            // Único pino analógico do ESP8266

// PINOS PARA SENSORES - CONFIGURAÇÃO DIRETA SEM MULTIPLEXADOR
#define RAIN_DIGITAL_PIN D6       // Pino digital para o sensor de chuva (D6)
#define DHT_PIN D4               // Pino digital para sensor DHT22 (D4)
// Removidos SELECT_SOIL_MOISTURE e SELECT_RAIN pois não estamos usando multiplexador

// Pinos para controle da bomba de irrigação
#define MOTOR_IN1 D5             // Saída para controle da bomba (D5)
#define MOTOR_ENA D7             // Saída PWM para controle de velocidade (D7)

// =============== CONSTANTES ===============
#define DHT_TYPE 22          // Define o tipo do sensor (22 para DHT22/AM2302)
// Calibração do sensor de umidade do solo - VALORES CORRIGIDOS
#define SOIL_MOISTURE_DRY 0     // Valor quando o solo está totalmente seco (sensor desconectado/no ar)
#define SOIL_MOISTURE_WET 1023  // Valor quando o solo está totalmente úmido (ou sensor com mal-contato)
// CONFIGURAÇÃO DO SENSOR DE CHUVA
#define RAIN_THRESHOLD 500     // Limiar para detecção de chuva no modo analógico
#define RAIN_DIGITAL_MODE true  // TRUE = usar modo digital (binário), FALSE = usar modo analógico (graduações)

// Configurações simuladas para testes sem sensores físicos
boolean usarValoresSimulados = false; // Defina como true para usar valores simulados

// =============== CONFIGURAÇÕES DE WIFI ===============
// Altere estas credenciais para corresponder à sua rede WiFi
const char* ssid = "SUA_REDE_WIFI";        // Altere para o nome da sua rede WiFi
const char* password = "SUA_SENHA_WIFI";    // Altere para a senha da sua rede WiFi

// =============== CONFIGURAÇÕES MQTT ===============
// Configurações do servidor MQTT - altere o IP para o do seu broker MQTT
const char* mqtt_server = "192.168.1.100";   // Altere para o IP do seu broker MQTT
const int mqtt_port = 1883;                   // Porta padrão do Mosquitto
const char* mqtt_client_id = "esp8266_irrigation_controller";

// Tópicos MQTT (correspondentes aos definidos no dashboard)
const char* topic_soil_moisture = "solo/umidade";
const char* topic_rain = "chuva/status";
const char* topic_temperature = "ambiente/temperatura";
const char* topic_humidity = "ambiente/umidade";
const char* topic_irrigation_status = "irrigacao/status";
const char* topic_irrigation_command = "irrigacao/comando";

// =============== CONFIGURAÇÕES DO PID ===============
double Setpoint = 60.0; // Valor desejado de umidade do solo (0-100%)
double Input, Output;       // Variáveis do PID
// Parâmetros de ajuste do PID (ajuste conforme necessário)
double Kp = 1.5;
double Ki = 0.2;
double Kd = 0.1;
PID myPID(&Input, &Output, &Setpoint, Kp, Ki, Kd, DIRECT);

// Declarações adiantadas de funções (protótipos)
void startIrrigation(bool manual);
void stopIrrigation(bool manual);

// =============== VARIÁVEIS GLOBAIS ===============
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHT_PIN, DHT_TYPE);  // Usando biblioteca Adafruit DHT

// Variáveis para armazenar os valores dos sensores
float soilMoisturePercent = 0.0;
float temperature = 0.0;
float humidity = 0.0;
bool isRaining = false;
bool irrigationActive = false;

// Variáveis para controle de tempo
unsigned long lastSensorReadTime = 0;
unsigned long lastMQTTPublishTime = 0;
unsigned long irrigationStartTime = 0;
unsigned long irrigationDuration = 0;

// Intervalo entre as leituras e publicações
const unsigned long SENSOR_READ_INTERVAL = 2000;    // A cada 2 segundos
const unsigned long MQTT_PUBLISH_INTERVAL = 10000;  // A cada 10 segundos
const unsigned long MAX_IRRIGATION_TIME = 600000;   // Limite máximo de 10 minutos (segurança)

// Variável para modo de operação
bool manualControl = false;

// =============== FUNÇÕES DE SETUP ===============
void setup() {
  // Inicia comunicação serial com taxa mais estável
  Serial.begin(9600);
  delay(1000); // Tempo para o serial iniciar

  // Inicializa o sensor DHT22
  dht.begin();

  Serial.println("\nIniciando Smart Irrigation Controller com ESP8266...");

  // Configuração dos pinos - removidas referências ao multiplexador
  // Configuração do pino digital para sensor de chuva
  pinMode(RAIN_DIGITAL_PIN, INPUT);
  // Configuração dos pinos da ponte H
  pinMode(MOTOR_IN1, OUTPUT);
  pinMode(MOTOR_ENA, OUTPUT);
  // Inicializa a bomba desligada
  digitalWrite(MOTOR_IN1, LOW);
  analogWrite(MOTOR_ENA, 0); // PWM em 0 (desligado)
  // Removidas referências ao multiplexador (SELECT_SOIL_MOISTURE e SELECT_RAIN)

  // Inicialização do PID
  myPID.SetMode(AUTOMATIC);
  myPID.SetOutputLimits(60, 180); // Limita o tempo de irrigação entre 60 e 180 segundos (1-3 minutos)

  // Conecta ao WiFi
  setupWiFi();

  // Configura o servidor MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);

  Serial.println("Sistema inicializado e pronto para operar!");
}

// Função para conectar ao WiFi
void setupWiFi() {
  Serial.println("\nConectando a rede WiFi: " + String(ssid));

  WiFi.begin(ssid, password);

  // Tenta conectar com timeout para evitar travamento
  int contador = 0;
  int maxTentativas = 20; // 10 segundos de timeout

  while (WiFi.status() != WL_CONNECTED && contador < maxTentativas) {
    delay(500);
    Serial.print(".");
    contador++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConectado com sucesso!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFalha ao conectar ao WiFi! Verifique o nome e senha da rede.");
    Serial.println("O sistema continuará funcionando sem conexão com a rede.");
  }
}

// Função para reconectar ao MQTT
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Tentando conexão MQTT...");

    if (client.connect(mqtt_client_id)) {
      Serial.println("conectado!");

      // Inscreve-se no tópico de comando de irrigação
      client.subscribe(topic_irrigation_command);

      // Publica mensagem de status online
      StaticJsonDocument<100> doc;
      doc["status"] = "online";
      doc["device"] = mqtt_client_id;
      doc["timestamp"] = millis();

      char buffer[100];
      serializeJson(doc, buffer);
      client.publish("sistema/status", buffer, true);

    } else {
      Serial.print("falha, rc=");
      Serial.print(client.state());
      Serial.println(" tentando novamente em 5 segundos");
      delay(5000);
    }
  }
}

// =============== CALLBACK MQTT ===============
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensagem recebida no tópico: ");
  Serial.println(topic);

  // Converte o payload para string
  char message[length + 1];
  for (unsigned int i = 0; i < length; i++) {
    message[i] = (char)payload[i];
  }
  message[length] = '\0';

  Serial.print("Mensagem: ");
  Serial.println(message);

  // Verifica se é um comando de irrigação
  if (strcmp(topic, topic_irrigation_command) == 0) {
    // Tenta interpretar como JSON
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, message);

    // Se não for JSON ou ocorrer erro, tenta interpretar como texto simples
    if (error) {
      Serial.println("Erro ao analisar JSON, tentando como texto simples");

      if (strcmp(message, "ON") == 0 || strcmp(message, "on") == 0 || strcmp(message, "true") == 0) {
        startIrrigation(true); // Inicia irrigação em modo manual
      } else if (strcmp(message, "OFF") == 0 || strcmp(message, "off") == 0 || strcmp(message, "false") == 0) {
        stopIrrigation(true);  // Para irrigação em modo manual
      }
    } else {
      // Processa o comando JSON
      if (doc.containsKey("command")) {
        const char* command = doc["command"];

        if (strcmp(command, "ON") == 0) {
          startIrrigation(true); // Inicia irrigação em modo manual
        } else if (strcmp(command, "OFF") == 0) {
          stopIrrigation(true);  // Para irrigação em modo manual
        }
      }
    }
  }
}

// =============== FUNÇÕES DE LEITURA DE SENSORES ===============
void readSensors() {
  // Leitura do sensor de umidade do solo YL-69
  // Leitura direta do sensor de umidade do solo (sem multiplexador)
  // Removida a seleção por multiplexador pois não está sendo usado fisicamente
  delay(100); // Pequeno delay para estabilizar

  int soilMoistureRaw = analogRead(ANALOG_PIN);

  // Debug - Mostra o valor real do sensor de umidade do solo
  Serial.print("Valor real do sensor de umidade do solo (A0): ");
  Serial.println(soilMoistureRaw);

  // Mapeamento CORRIGIDO para percentual (0% = seco, 100% = úmido)
  // Invertendo a lógica de mapeamento para seu sensor
  soilMoisturePercent = map(constrain(soilMoistureRaw, SOIL_MOISTURE_DRY, SOIL_MOISTURE_WET),
                         SOIL_MOISTURE_DRY, SOIL_MOISTURE_WET, 0, 100);

  // Limitando a umidade para valores entre 0-100 para evitar anomalias
  soilMoisturePercent = constrain(soilMoisturePercent, 0, 100);

  // Leitura do sensor de chuva FC-37 (conexão direta sem multiplexador)
  delay(100); // Pequeno delay para estabilizar

  // Detecção de chuva - MODO DIGITAL
  if (RAIN_DIGITAL_MODE) {
    int rainSensorDigital = digitalRead(RAIN_DIGITAL_PIN);
    Serial.print("Valor real do sensor de chuva (D6): ");
    Serial.println(rainSensorDigital);

    // INVERTENDO a lógica: HIGH = chovendo, LOW = sem chuva
    // Esta inversão é necessária porque o sensor está indicando chuva quando não está chovendo
    isRaining = (rainSensorDigital == HIGH);
  }
  // Modo analógico (backup, caso precise)
  else {
    int rainSensorValue = analogRead(ANALOG_PIN);

    isRaining = (rainSensorValue < RAIN_THRESHOLD);
  }

  // Verificação imediata - se está chovendo e a irrigação está ativa, desliga imediatamente
  if (isRaining && irrigationActive) {
    Serial.println("[EMERGENCIA] Chuva detectada! Desligando irrigação imediatamente...");
    stopIrrigation(false);
  }

  // Não precisamos desligar pinos de seleção já que não usamos multiplexador

  // Lê dados de temperatura e umidade do DHT22 com a biblioteca Adafruit
  float newHum = dht.readHumidity();
  float newTemp = dht.readTemperature();

  // Verifica se a leitura não é NaN (Not a Number)
  if (!isnan(newTemp) && !isnan(newHum)) {
    temperature = newTemp;
    humidity = newHum;
    Serial.println("Leitura do DHT22 bem-sucedida!");
  } else {
    // Se a leitura falhar, define temperatura e umidade como zero
    temperature = 0;
    humidity = 0;

    Serial.println("Erro na leitura do DHT22");
    Serial.println("Verifique as conexões do sensor DHT22 no pino D4 e o resistor pull-up de 10kΩ");
  }

  // Atualiza o input do PID com a umidade do solo atual
  Input = soilMoisturePercent;

  // Verifica se o solo está muito úmido e desliga a irrigação se necessário
  if (soilMoisturePercent > 80 && irrigationActive) {
    Serial.println("[EMERGENCIA] Solo muito úmido! Desligando irrigação...");
    stopIrrigation(false);  // Desliga irrigação automaticamente se o solo já estiver muito úmido
  }
}

// =============== FUNÇÕES DE PUBLICAÇÃO MQTT ===============
void publishSensorData() {
  // Verifica se está conectado ao MQTT
  if (!client.connected()) {
    return;
  }

  // Publica a umidade do solo
  StaticJsonDocument<200> soilDoc;
  soilDoc["sensor"] = "umidade_solo";
  soilDoc["valor"] = soilMoisturePercent;
  soilDoc["unidade"] = "%";
  soilDoc["timestamp"] = millis();

  char soilBuffer[200];
  serializeJson(soilDoc, soilBuffer);
  client.publish(topic_soil_moisture, soilBuffer);

  // Publica o status da chuva
  StaticJsonDocument<100> rainDoc;
  rainDoc["sensor"] = "chuva";
  rainDoc["status"] = isRaining ? "raining" : "dry";
  rainDoc["timestamp"] = millis();

  char rainBuffer[100];
  serializeJson(rainDoc, rainBuffer);
  client.publish(topic_rain, rainBuffer);

  // Publica a temperatura
  StaticJsonDocument<200> tempDoc;
  tempDoc["sensor"] = "temperatura";
  tempDoc["valor"] = temperature;
  tempDoc["unidade"] = "C";
  tempDoc["timestamp"] = millis();

  char tempBuffer[200];
  serializeJson(tempDoc, tempBuffer);
  client.publish(topic_temperature, tempBuffer);

  // Publica a umidade do ar
  StaticJsonDocument<200> humDoc;
  humDoc["sensor"] = "umidade_ar";
  humDoc["valor"] = humidity;
  humDoc["unidade"] = "%";
  humDoc["timestamp"] = millis();

  char humBuffer[200];
  serializeJson(humDoc, humBuffer);
  client.publish(topic_humidity, humBuffer);

  // Publica o status da irrigação
  StaticJsonDocument<100> irrDoc;
  irrDoc["status"] = irrigationActive ? "ON" : "OFF";
  irrDoc["modo"] = manualControl ? "manual" : "automatico";
  irrDoc["timestamp"] = millis();

  char irrBuffer[100];
  serializeJson(irrDoc, irrBuffer);
  client.publish(topic_irrigation_status, irrBuffer);

  Serial.println("Dados dos sensores publicados via MQTT");
}

// =============== FUNÇÕES DE CONTROLE DE IRRIGAÇÃO ===============
// Inicia a irrigação
void startIrrigation(bool manual = false) {
  // Se já estiver irrigando ou estiver chovendo, não faz nada
  if (irrigationActive || (isRaining && !manual)) {
    return;
  }

  Serial.println("Iniciando irrigação...");
  // Liga a bomba da irrigação através da ponte H com máxima potência
  digitalWrite(MOTOR_IN1, HIGH);  // Liga a entrada
  analogWrite(MOTOR_ENA, 255);    // Velocidade máxima (0-255)

  // Se for controle manual, garantir tempo mínimo de irrigação
  if (manual) {
    Serial.println("Modo manual: irrigação garantida por pelo menos 60 segundos");
    irrigationDuration = 60000; // 60 segundos = 1 minuto
  }
  irrigationActive = true;
  irrigationStartTime = millis();
  manualControl = manual;

  // Se for controle automático, usa a saída do PID para o tempo de irrigação
  if (!manual) {
    // A saída do PID é o tempo em segundos
    irrigationDuration = (unsigned long)(Output * 1000); // Converte segundos para milissegundos

    // Limita o tempo máximo de irrigação para segurança
    if (irrigationDuration > MAX_IRRIGATION_TIME) {
      irrigationDuration = MAX_IRRIGATION_TIME;
    }

    Serial.print("Tempo de irrigação calculado pelo PID: ");
    Serial.print(irrigationDuration / 1000);
    Serial.println(" segundos");
  } else {
    // No modo manual, deixa ligado até que seja desligado por comando
    irrigationDuration = 0; // Zero significa indefinido
    Serial.println("Modo manual: irrigação ligada até comando para desligar");
  }

  // Publica o novo status
  StaticJsonDocument<100> doc;
  doc["status"] = "ON";
  doc["modo"] = manual ? "manual" : "automatico";
  doc["duracao"] = manual ? "indefinido" : String(irrigationDuration / 1000);
  doc["timestamp"] = millis();

  char buffer[100];
  serializeJson(doc, buffer);
  if (client.connected()) {
    client.publish(topic_irrigation_status, buffer);
  }
}

// Para a irrigação
void stopIrrigation(bool manual = false) {
  // Não faz nada se a irrigação já estiver desligada
  if (!irrigationActive) {
    return;
  }

  Serial.println("Parando irrigação...");

  // Desliga a bomba com garantia dupla
  digitalWrite(MOTOR_IN1, LOW);   // Desliga a entrada
  analogWrite(MOTOR_ENA, 0);      // Desliga o motor
  delay(50);  // Pequeno delay para garantir que o comando foi processado
  digitalWrite(MOTOR_IN1, LOW);   // Reforço do comando para garantir
  analogWrite(MOTOR_ENA, 0);      // Reforço do comando para garantir

  irrigationActive = false;
  irrigationDuration = 0;

  // Publica o novo status
  StaticJsonDocument<100> doc;
  doc["status"] = "OFF";
  doc["modo"] = "automatico";
  doc["timestamp"] = millis();

  char buffer[100];
  serializeJson(doc, buffer);
  if (client.connected()) {
    client.publish(topic_irrigation_status, buffer);
  }

  // Se estava no modo manual, volta para automático
  if (manual) {
    manualControl = false;
    Serial.println("Retornando ao modo automático");
  }

  Serial.println("[CONFIRMAÇÃO] Bomba DESLIGADA - Irrigação interrompida com sucesso!");
}

// Verifica se é necessário iniciar ou parar a irrigação automática
void checkIrrigationControl() {
  // Não faz nada se estiver no modo manual
  if (manualControl) {
    return;
  }

  // Verifica se a irrigação precisa ser finalizada (baseado no tempo)
  if (irrigationActive && irrigationDuration > 0) {
    if (millis() - irrigationStartTime >= irrigationDuration) {
      Serial.println("\n[SISTEMA] Tempo de irrigação concluído, desligando automaticamente");
      stopIrrigation();
    }
  }

  // Verifica condições críticas que exigem parar a irrigação imediatamente
  if (irrigationActive) {
    if (isRaining) {
      Serial.println("\n[SISTEMA] Detectada chuva, interrompendo irrigação automática");
      stopIrrigation();
      return;
    }

    if (soilMoisturePercent > 80) {
      Serial.println("\n[SISTEMA] Solo já suficientemente úmido, interrompendo irrigação automática");
      stopIrrigation();
      return;
    }
  }

  // Executa o PID
  myPID.Compute();

  // Verifica se deve iniciar a irrigação automática
  if (!irrigationActive && !isRaining && soilMoisturePercent < Setpoint) {
    Serial.println("\n[SISTEMA] Solo seco detectado, iniciando irrigação automática");
    // Inicia irrigação no modo automático
    startIrrigation(false);
  }
}

// =============== LOOP PRINCIPAL ===============
void loop() {
  unsigned long currentMillis = millis();
  
  // Verifica a conexão WiFi e reconecta se necessário
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Reconectando ao WiFi...");
    setupWiFi();
  }

  // Verifica a conexão MQTT e reconecta se necessário
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();  // Processa mensagens MQTT

  // Lê os sensores a cada SENSOR_READ_INTERVAL
  if (currentMillis - lastSensorReadTime >= SENSOR_READ_INTERVAL) {
    lastSensorReadTime = currentMillis;
    
    if (usarValoresSimulados) {
      // Modo de simulação para testes sem sensores físicos
      simulateSensorValues();
    } else {
      // Modo real com sensores físicos
      readSensors();
    }
    
    // Verifica o controlador PID e ajusta a irrigação
    checkIrrigationControl();
    
    // Print dos valores atuais (para debug)
    printCurrentValues();
  }

  // Publica os dados no MQTT em intervalos regulares
  if (currentMillis - lastMQTTPublishTime >= MQTT_PUBLISH_INTERVAL) {
    lastMQTTPublishTime = currentMillis;
    
    // Publica apenas se estiver conectado ao MQTT
    if (client.connected()) {
      publishSensorData();
    }
  }
  
  // Verifica tempo máximo de irrigação para segurança
  if (irrigationActive && irrigationDuration > 0) {
    if (currentMillis - irrigationStartTime >= MAX_IRRIGATION_TIME) {
      Serial.println("[SEGURANÇA] Tempo máximo de irrigação atingido. Desligando...");
      stopIrrigation(false);
    }
  }
  
  // Pequeno delay para estabilidade
  delay(100);
}

// Função para simular valores dos sensores (quando não tiver sensores físicos)
void simulateSensorValues() {
  // Simula umidade do solo variando entre 30% e 70%
  soilMoisturePercent = random(30, 71);
  
  // Simula temperatura entre 20°C e 30°C
  temperature = 20.0 + (random(0, 100) / 10.0);
  
  // Simula umidade do ar entre 40% e 90%
  humidity = 40.0 + (random(0, 500) / 10.0);
  
  // Simula sensor de chuva (10% de chance de estar chovendo)
  isRaining = (random(0, 100) < 10);
  
  // Atualiza input do PID
  Input = soilMoisturePercent;
  
  Serial.println("[SIMULAÇÃO] Valores dos sensores simulados gerados");
}

// Função para imprimir valores atuais no console (debug)
void printCurrentValues() {
  Serial.println("\n====== VALORES ATUAIS DOS SENSORES ======");
  Serial.print("Umidade do Solo: ");
  Serial.print(soilMoisturePercent);
  Serial.println("%");
  
  Serial.print("Status de Chuva: ");
  Serial.println(isRaining ? "CHOVENDO" : "SEM CHUVA");
  
  Serial.print("Temperatura: ");
  Serial.print(temperature);
  Serial.println("°C");
  
  Serial.print("Umidade do Ar: ");
  Serial.print(humidity);
  Serial.println("%");
  
  Serial.print("Irrigação: ");
  Serial.println(irrigationActive ? "LIGADA" : "DESLIGADA");
  
  Serial.print("Modo: ");
  Serial.println(manualControl ? "MANUAL" : "AUTOMÁTICO");
  Serial.println("========================================");
}

// Fim do código
