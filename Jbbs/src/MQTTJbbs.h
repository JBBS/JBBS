/*
 * MQTTJbbs.h
 *
 *  Created on: 26 apr 2017
 *      Author: 401993
 */

#ifndef MQTTJBBS_H_
#define MQTTJBBS_H_

#include <stdio.h>
#include <string.h>
#include <iostream>


// #include "include/mosquittopp.h"
// mosquitto
#include <mosquittopp.h>

#include <unistd.h>

class MQTTJbbs : public mosqpp::mosquittopp {

	void on_disconnect(int rc);
	void on_connect(int);
	void on_message(const struct mosquitto_message *);

public:
	MQTTJbbs(const char* id, const char* host, int port,
			void (*on_connect)(int),
			void (*on_message)(const struct mosquitto_message *));
	~MQTTJbbs();
	void send(void);

};

#endif /* MQTTJBBS_H_ */
