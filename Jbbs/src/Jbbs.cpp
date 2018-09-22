/*
 * Jbbs.cpp
 *
 *  Created on: Apr 25, 2017
 *      Author: mizio
 */

#include "Jbbs.h"               // For Jbbs

GlobalStatus jbbsStatus;
class Sparge spargeTun( &jbbsStatus );
class Mash mashTun( &jbbsStatus );

//MQTT globals
class MQTTJbbs *mqttClient;
const int mqtt_max_topics = 1;
const char* const mqtt_topics[mqtt_max_topics] = {"dashboard/#"};

// LCD
class JbbsLcd lcd(LCD_ADDR, LCD_BASE);
char lblL[]="00:00";
char lblR[]="00:00";

// --------------------------------------------------------------
// Setup
// --------------------------------------------------------------
bool setup() {

	std::cout << "Jbbs Booting... " << std::endl;

	// setup globale di Wiring Pi
	// per come inizializzare senza essere root vedi qui
	// https://www.raspberrypi.org/forums/viewtopic.php?f=34&t=51265

	wiringPiSetup ();

	// Setup della board i2c mcp23017 che governa i rele'
	if (mcp23017Setup(MCP_BASE, MCP23017)) {

		for (int i= 0; i < 16; i++) {
			pinMode (MCP_BASE + i, OUTPUT) ;
		}
		std::cout << "Inizializzazione Scheda Rele' terminata correttamente" << std::endl;
	} else {
		std::cout << "Problemi in inizializzazione Scheda Rele' " << std::endl;
		return (false);
	}

	// Setup della board i2c pcf8574 che governa i sensori
	if (pcf8574Setup(PCF_BASE, PCF8574)) {
		for (int i= 0; i < 8; i++) {
			pinMode (PCF_BASE + i, INPUT) ;
		}
		std::cout << "Inizializzazione Scheda Sensori terminata correttamente" << std::endl;
	} else {
		std::cout << "Problemi in inizializzazione Scheda Sensori " << std::endl;
		return (false);
	}

	mqttClient = new MQTTJbbs("Jbbs", "localhost", 1883, onConnectCallback, onMessageCallBack);

	std::cout << "Setup completato Correttamente " << std::endl;
	return (true);

}

// --------------------------------------------------------------
// Loop
// --------------------------------------------------------------
void loop() {

	int ret;
	static int cicle = 0;
	char buffLabel[30];
	std::string tunStatus;

	mqttClient->loop();

// --- Loop dello Sparge
	spargeTun.loop();
	tunStatus = spargeTun.getStatus();
//	std::cout << tunStatus << std::endl;

	if ((ret=mqttClient->publish(NULL, spargeTun.statusTopic.c_str(), tunStatus.length(), tunStatus.c_str(),2))) {

		std::cout << "Problema nell'invio dello Status dello Sparge. Return code: " << ret << std::endl;
		std::cout << "\t Topic: |" << spargeTun.statusTopic << "|" << std::endl;
		std::cout << "\t Length=" << tunStatus.length()+1 << std::endl;
		std::cout << "\t Payload=|" << tunStatus << "|" << std::endl;
	}

// --- Loop del Mash
	mashTun.loop();
	tunStatus = mashTun.getStatus();
//	std::cout << tunStatus << std::endl;

	if ((ret=mqttClient->publish(NULL, mashTun.statusTopic.c_str(), tunStatus.length(), tunStatus.c_str(),2))) {

		std::cout << "Problema nell'invio dello Status del MASH. Return code: " << ret << std::endl;
		std::cout << "\t Topic: |" << mashTun.statusTopic << "|" << std::endl;
		std::cout << "\t Length=" << tunStatus.length()+1 << std::endl;
		std::cout << "\t Payload=|" << tunStatus << "|" << std::endl;
	}

	// Aggiorno i dati sull'LCD

	// Le temperature
	lcd.setTempSparge(spargeTun.getTempActual());
	lcd.setTempMash(mashTun.getTempActual());
	lcd.setTempBoil(0.0);

	switch(cicle) {
		case 0 : // Turno dello Sparge
			sprintf(buffLabel, "Sparge: %*s", 12, spargeTun.getStateDesc());
			lcd.setStepLabel(buffLabel);
			break;
		case 1 : // Turno del MASH
			// Il nome della step in esecuzione
			sprintf(buffLabel, "Mash: %*s", 14, mashTun.getStateDesc());
			lcd.setStepLabel(buffLabel);
			break;
		case 2 : // Turno del boil
			break;
	}
	cicle = (cicle + 1) % 2; // Passo al successivo

	// La progress Bar
    if (strftime(lblL, sizeof(lblL), "%R", localtime(mashTun.getTimeStart()))) {
        lcd.setBarLeftLabel(lblL);
    } else {
        lcd.setBarLeftLabel("Error");
    }
    if (strftime(lblR, sizeof(lblR), "%R", localtime(mashTun.getTimeFinish()))) {
        lcd.setBarRightLabel(lblR);
    }
    lcd.setBarPercent(mashTun.getPercent());

    lcd.draw();

	std::this_thread::sleep_for(std::chrono::seconds(1));

}

int main(int argc, char* argv[]) {

	if (setup()) {

		while (true) {
			loop();
		}

	} else {
		std::cout << "Errori in fase di inizializzazione. Esco." << std::endl;
	}

}

void onConnectCallback(int rc) {

	if(rc == 0){
		 std::cout << ">> myMosq - connected with server" << std::endl;

		// faccio le mie sottoscrizioni
		for (int i = 0; i < mqtt_max_topics; i++) {
			mqttClient->subscribe(NULL, mqtt_topics[i], 2);
			printf("Subscribed to:%s\n", mqtt_topics[i]);
		}

	} else {
		std::cout << ">> myMosq - Impossible to connect with server(" << rc << ")" << std::endl;
	}

}

// ---------------------------------------------------------------
//  Callback richiamata per gestire i messaggi MQTT
// ---------------------------------------------------------------

void onMessageCallBack(const struct mosquitto_message* message) {

	char parms[message->payloadlen + 1];
	char **topics;
	int topic_count;

//	std::cout << ">> Message arrived " << std::endl;

	mosquitto_sub_topic_tokenise(message->topic, &topics, &topic_count);

	/* Copy N-1 bytes to ensure always 0 terminated. */
	memset(parms, 0, (message->payloadlen + 1) * sizeof(char));
	memcpy(parms, message->payload, message->payloadlen * sizeof(char));

//	std::cout << ">> Topic = " << message->topic << std::endl;
//	std::cout << ">> Payload = " << parms << std::endl;

	// Indirizzo il messaggio al giusto destinatario
	if (strcasecmp(topics[1], MashMqttID.c_str()) == 0) {
	  mashTun.execute(topics[2], parms);
	}

	if (strcasecmp(topics[1], SpargeMqttID.c_str()) == 0) {
	  spargeTun.execute(topics[2], parms);
	}

}
