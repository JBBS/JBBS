/*
 * Jbbs.cpp
 *
 *  Created on: Apr 25, 2017
 *      Author: mizio
 */

#include "Jbbs.h"               // For Jbbs

GlobalStatus jbbsStatus;

Sparge *spargeTun;
Mash *mashTun;
Boil *boilTun;

//MQTT globals
class MQTTJbbs *mqttClient;
const int mqtt_max_topics = 4;
const char* const mqtt_topics[mqtt_max_topics] = 	{	"dashboard/#",
														"mash/#",		//MashMqttID.c_str(),
														"sparge/#", 	//SpargeMqttID.c_str(),
														"boil/#"			//BoilMqttID.c_str()
													};

// LCD
class JbbsLcd lcd(LCD_ADDR, LCD_BASE);
char lblL[]="00:00";
char lblR[]="00:00";

// --------------------------------------------------------------
// Setup
// --------------------------------------------------------------
bool setup() {

	mqttClient = new MQTTJbbs("Jbbs", "homeserver.local", 1883, onConnectCallback, onMessageCallBack);
	jbbsStatus.mqttClient = mqttClient;

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


	spargeTun = new Sparge( &jbbsStatus );
	mashTun = new Mash ( &jbbsStatus );
	boilTun = new Boil( &jbbsStatus );


	std::cout << "Setup completato Correttamente " << std::endl;
	return (true);

}

// --------------------------------------------------------------
// Loop
// --------------------------------------------------------------
void loop() {

	// temporizzazione visualizzazione LCD
	const int LOOPTIME = 5;

	static int cicle = 0;
	static time_t windowStartTime = 0;

	// temporizzazione invio status mqtt
	const int TIMESTATUS = 2;
	static time_t mqttStartTime = 0;
	bool sendMQTT = false;

	int ret;
	char buffLabel[30];
	std::string tunStatus;

	mqttClient->loop();

	sendMQTT = ( (time(0) - mqttStartTime) > TIMESTATUS );
	if ( sendMQTT ) {

		mqttStartTime = time(0);
	}


// --- Loop dello Sparge
	spargeTun->loop();
	if ( sendMQTT ) {

		tunStatus = spargeTun->getStatus();
	//	std::cout << tunStatus << std::endl;

		if ((ret=mqttClient->publish(NULL, spargeTun->statusTopic.c_str(), tunStatus.length(), tunStatus.c_str(),2))) {

			std::cout << "Problema nell'invio dello Status dello Sparge. Return code: " << ret << std::endl;
			std::cout << "\t Topic: |" << spargeTun->statusTopic << "|" << std::endl;
			std::cout << "\t Length=" << tunStatus.length()+1 << std::endl;
			std::cout << "\t Payload=|" << tunStatus << "|" << std::endl;
		}
	}

// --- Loop del Mash
	mashTun->loop();
	if ( sendMQTT ) {
		tunStatus = mashTun->getStatus();
	//	std::cout << tunStatus << std::endl;

		if ((ret=mqttClient->publish(NULL, mashTun->statusTopic.c_str(), tunStatus.length(), tunStatus.c_str(),2))) {

			std::cout << "Problema nell'invio dello Status del MASH. Return code: " << ret << std::endl;
			std::cout << "\t Topic: |" << mashTun->statusTopic << "|" << std::endl;
			std::cout << "\t Length=" << tunStatus.length()+1 << std::endl;
			std::cout << "\t Payload=|" << tunStatus << "|" << std::endl;
		}
	}

// --- Loop del Boil

	boilTun->loop();
	if ( sendMQTT ) {
		tunStatus = boilTun->getStatus();
//	std::cout << tunStatus << std::endl;

		if ((ret=mqttClient->publish(NULL, boilTun->statusTopic.c_str(), tunStatus.length(), tunStatus.c_str(),2))) {

			std::cout << "Problema nell'invio dello Status del BOIL. Return code: " << ret << std::endl;
			std::cout << "\t Topic: |" << boilTun->statusTopic << "|" << std::endl;
			std::cout << "\t Length=" << tunStatus.length()+1 << std::endl;
			std::cout << "\t Payload=|" << tunStatus << "|" << std::endl;
		}
	}

	// Aggiorno i dati sull'LCD ogni LOOPTIME secondi
	if ( (time(0) - windowStartTime) > LOOPTIME) {

		windowStartTime = time(0);

		// Le temperature
		lcd.setTempSparge(spargeTun->getTempActual());
		lcd.setTempMash(mashTun->getTempActual());
		lcd.setTempBoil(boilTun->getTempActual());

		switch(cicle) {

			case 0 : // Turno dello Sparge
				sprintf(buffLabel, "Sparge: %*s", 12, spargeTun->getStateDesc());
				lcd.setStepLabel(buffLabel);
				if (strftime(lblL, sizeof(lblL), "%R", localtime(spargeTun->getTimeStart()))) {
					lcd.setBarLeftLabel(lblL);
				} else {
					lcd.setBarLeftLabel("Error");
				}
				if (strftime(lblR, sizeof(lblR), "%R", localtime(spargeTun->getTimeFinish()))) {
					lcd.setBarRightLabel(lblR);
				}
				lcd.setBarPercent(spargeTun->getPercent());
				break;
			case 1 : // Turno del MASH
				// Il nome della step in esecuzione
				sprintf(buffLabel, "Mash: %*s", 14, mashTun->getStateDesc());
				lcd.setStepLabel(buffLabel);
				if (strftime(lblL, sizeof(lblL), "%R", localtime(mashTun->getTimeStart()))) {
					lcd.setBarLeftLabel(lblL);
				} else {
					lcd.setBarLeftLabel("Error");
				}
				if (strftime(lblR, sizeof(lblR), "%R", localtime(mashTun->getTimeFinish()))) {
					lcd.setBarRightLabel(lblR);
				}
				lcd.setBarPercent(mashTun->getPercent());
				break;
			case 2 : // Turno del boil
				sprintf(buffLabel, "Boil: %*s", 14, boilTun->getStateDesc());
				lcd.setStepLabel(buffLabel);
				if (strftime(lblL, sizeof(lblL), "%R", localtime(boilTun->getTimeStart()))) {
					lcd.setBarLeftLabel(lblL);
				} else {
					lcd.setBarLeftLabel("Error");
				}
				if (strftime(lblR, sizeof(lblR), "%R", localtime(boilTun->getTimeFinish()))) {
					lcd.setBarRightLabel(lblR);
				}
				lcd.setBarPercent(boilTun->getPercent());
				break;
		}

		cicle = (cicle + 1) % 3; // Passo al successivo

		lcd.draw();
	}

	// std::this_thread::sleep_for(std::chrono::seconds(1));

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
//		 std::cout << ">> myMosq - connected with server" << std::endl;

		// faccio le mie sottoscrizioni
		for (int i = 0; i < mqtt_max_topics; i++) {
			mqttClient->subscribe(NULL, mqtt_topics[i], 2);
//			printf("Subscribed to:%s\n", mqtt_topics[i]);
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
	  mashTun->execute(topics[2], parms);
	}

	if (strcasecmp(topics[1], SpargeMqttID.c_str()) == 0) {
	  spargeTun->execute(topics[2], parms);
	}

	if (strcasecmp(topics[1], BoilMqttID.c_str()) == 0) {
	  boilTun->execute(topics[2], parms);
	}

}
