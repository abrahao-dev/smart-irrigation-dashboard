# Smart Irrigation Dashboard 🌱💧

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

Um sistema de monitoramento e controle de irrigação em tempo real que permite acompanhar dados de umidade do solo, temperatura ambiente e status de chuva, além de controlar remotamente a irrigação.

## 📊 Funcionalidades

- **Monitoramento em Tempo Real**: Visualização de dados de sensores atualizados via MQTT
- **Estatísticas Avançadas**: Cálculo automático de média e desvio padrão das medições
- **Painel de Controle**: Acionamento manual do sistema de irrigação
- **Visualização de Dados**: Gráficos interativos mostrando histórico de medições
- **Sistema de Login**: Autenticação simples para acesso ao dashboard
- **Design Responsivo**: Interface adaptável para dispositivos móveis e desktop
- **Modo Escuro**: Suporte a tema claro/escuro para melhor visualização

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React.js com Vite
- **Estilização**: Tailwind CSS v3
- **Gráficos**: Recharts para visualização de dados
- **Comunicação**: Paho MQTT para conexão com sensores
- **Formatação de Datas**: Day.js
- **Ícones**: React Icons

## 🚀 Instalação

### Pré-requisitos

- Node.js (v14+)
- npm ou yarn

### Passos para Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/smart-irrigation-dashboard.git
   cd smart-irrigation-dashboard
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configure as variáveis de ambiente (opcional):
   Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   VITE_MQTT_HOST=seu-broker-mqtt.com
   VITE_MQTT_PORT=8083
   VITE_MQTT_PATH=/mqtt
   VITE_MQTT_USERNAME=seu_usuario
   VITE_MQTT_PASSWORD=sua_senha
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

5. Acesse o dashboard em `http://localhost:5173`

## 🔧 Configuração

### Configuração do MQTT

O dashboard está configurado para se conectar a um broker MQTT para receber dados dos sensores. Os tópicos utilizados são:

- `solo/umidade` - Dados de umidade do solo (%)
- `chuva/status` - Status de chuva (true/false)
- `ambiente/temperatura` - Temperatura ambiente (°C)
- `ambiente/umidade` - Umidade do ar (%)
- `irrigacao/status` - Status da irrigação (ON/OFF)
- `irrigacao/comando` - Controle da irrigação (ON/OFF)

### Autenticação

O sistema utiliza uma autenticação simples para demonstração:

- **Usuário**: `admin`
- **Senha**: `irrigation123`

## 📱 Uso

1. Faça login no sistema usando as credenciais padrão
2. Visualize os dados em tempo real no dashboard
3. Analise as tendências através dos gráficos
4. Controle manualmente a irrigação através do painel de controle

## 📊 Estatísticas

O dashboard calcula automaticamente as seguintes estatísticas para os dados visualizados:

- **Média**: Valor médio das leituras no período selecionado
- **Desvio Padrão**: Medida da dispersão dos valores em relação à média

Estas estatísticas são exibidas em tempo real e atualizadas conforme novos dados são recebidos.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests para melhorar o sistema.

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📧 Contato

Para questões ou sugestões, entre em contato através de [seu-email@exemplo.com](mailto:seu-email@exemplo.com).
