# Sistema de Irrigação Inteligente - ESP8266 NodeMCU

Este projeto implementa um sistema de irrigação automático utilizando ESP8266 (NodeMCU), que se comunica com um dashboard web via MQTT.

## Componentes Utilizados

- **ESP8266 NodeMCU**: Microcontrolador com WiFi integrado
- **FC-37**: Sensor de chuva
- **YL-69**: Sensor de umidade do solo
- **DHT22**: Sensor de temperatura e umidade do ar
- **Módulo de relé**: Para controlar a bomba/válvula de irrigação
- **Multiplexador ou chaves digitais**: Para compartilhar o único pino analógico do ESP8266

## Funcionalidades

- Monitoramento em tempo real de umidade do solo, temperatura, umidade do ar e detecção de chuva
- Controle automático de irrigação baseado em PID
- Modo manual via comandos MQTT do dashboard
- Publicação de dados no broker MQTT para visualização no dashboard
- Failsafe para evitar irrigação durante chuva
- Proteção contra irrigação excessiva (limite de tempo máximo)

## Configuração

1. Instale as bibliotecas necessárias no Arduino IDE:
   - ESP8266WiFi
   - PubSubClient
   - ArduinoJson
   - DHT Sensor Library
   - PID

2. Configure as credenciais WiFi e o servidor MQTT no início do código:
   ```cpp
   const char* ssid = "SUA_REDE_WIFI";
   const char* password = "SUA_SENHA_WIFI";
   const char* mqtt_server = "broker.hivemq.com";
   ```

3. Ajuste os pinos conforme sua montagem física:
   ```cpp
   #define ANALOG_PIN A0
   #define SELECT_SOIL_MOISTURE D1
   #define SELECT_RAIN D2
   #define DHT_PIN D4
   #define IRRIGATION_RELAY_PIN D5
   ```

4. Calibre os parâmetros dos sensores de acordo com suas medições:
   ```cpp
   #define SOIL_MOISTURE_DRY 1024  // Valor quando o solo está seco
   #define SOIL_MOISTURE_WET 300   // Valor quando o solo está úmido
   #define RAIN_THRESHOLD 500      // Limiar para detectar chuva
   ```

5. Opcionalmente, ajuste os parâmetros do controlador PID:
   ```cpp
   double Kp = 2.0;
   double Ki = 0.5;
   double Kd = 1.0;
   double Setpoint = 50;  // Umidade alvo em porcentagem
   ```

## Configuração de Hardware para Compartilhamento do Pino Analógico

O ESP8266 possui apenas um pino analógico (A0), mas nosso projeto precisa ler dois sensores analógicos. Há duas opções:

### Opção 1: Multiplexador Analógico
Use um multiplexador analógico como o CD4051 para conectar múltiplos sensores analógicos a um único pino A0:

- **CD4051**:
  - VCC → 3.3V
  - GND → GND
  - Comum (Z) → A0 do ESP8266
  - Pino de seleção A → D1 (SELECT_SOIL_MOISTURE)
  - Pino de seleção B → D2 (SELECT_RAIN)
  - Enable → GND
  - Z0 → YL-69 (umidade do solo)
  - Z1 → FC-37 (sensor de chuva)

### Opção 2: Chaves de Transistor
Uma alternativa simples é usar dois transistores como chaves digitais:

- Transistores (2x 2N2222 ou similar) para ativar apenas um sensor de cada vez
- Resistores de pull-up/down conforme necessário

## Conexões Físicas

- **YL-69 (Umidade do Solo)**:
  - VCC → 3.3V
  - GND → GND
  - AO → A0 (pino analógico)

- **FC-37 (Sensor de Chuva)**:
  - VCC → 3.3V
  - GND → GND
  - DO → D6 (pino digital)

- **DHT22**:
  - VCC → 3.3V
  - GND → GND
  - DATA → D4

- **Módulo Relé**:
  - VCC → VU (5V do USB) no NodeMCU
  - GND → GND
  - IN → D5

## Estrutura MQTT

O ESP8266 utiliza os seguintes tópicos MQTT:

| Tópico | Direção | Descrição |
|--------|---------|------------|
| `solo/umidade` | Publicação | Valores de umidade do solo |
| `chuva/status` | Publicação | Estado do sensor de chuva |
| `ambiente/temperatura` | Publicação | Temperatura ambiente |
| `ambiente/umidade` | Publicação | Umidade do ar |
| `irrigacao/status` | Publicação | Estado atual do sistema de irrigação |
| `irrigacao/comando` | Assinatura | Recebe comandos para ativar/desativar irrigação |

## Formato de Mensagens

As mensagens são enviadas no formato JSON. Exemplos:

**Publicação de umidade do solo**:
```json
{
  "sensor": "umidade_solo",
  "valor": 39.5,
  "unidade": "%",
  "timestamp": 1234567890
}
```

**Comando de irrigação**:
```json
{
  "command": "ON"
}
```
ou simplesmente `"ON"` como texto plano.

## Solução de Problemas

- **ESP8266 não conecta ao WiFi**: Verifique as credenciais de WiFi
- **Falha na conexão MQTT**: Verifique se o broker MQTT está acessível
- **Leituras incorretas de umidade**: Calibre os valores `SOIL_MOISTURE_DRY` e `SOIL_MOISTURE_WET`
- **Irrigação não ativa**: Verifique o relé e a configuração do `Setpoint`
- **Valores analógicos inconsistentes**: Verifique a configuração do multiplexador e os delays entre as leituras
