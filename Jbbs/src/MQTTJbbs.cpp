/*
 * MQTTJbbs.cpp
 *
 *  Created on: 26 apr 2017
 *      Author: 401993
 */

#include "MQTTJbbs.h"


void (*fun_on_connect)(int);
void (*fun_on_message)(const struct mosquitto_message *);

// --------------------------------------------------------------
// Costruttore. I parametri sono:
//
// id: 			Id Client
// Host: 		url o ip del server
// port: 		porta del server
// on_connect: 	callback chiamata on connect
// on_message: 	callback chiamata on Message
// --------------------------------------------------------------
MQTTJbbs::MQTTJbbs(const char* id, const char* host, int port,
					void (*on_connect)(int),
					void (*on_message)(const struct mosquitto_message *)) : mosquittopp(id, true) {

	// Inizializzo la libreria, mi connetto in asynch al server e lancio il thread di Mosquitto



	int keepalive = 60;

	fun_on_connect = on_connect;
	fun_on_message = on_message;

	mosqpp::lib_init();        // Mandatory initialization for mosquitto library
    connect_async(host, port, keepalive);

    loop_start();

}

// --------------------------------------------------------------
// distruttore
// --------------------------------------------------------------

MQTTJbbs::~MQTTJbbs() {

	loop_stop();            // Kill the thread
	mosqpp::lib_cleanup();    // Mosquitto library cleanup
}

void MQTTJbbs::on_disconnect(int rc) {

	std::cout << ">> myMosq - disconnection(" << rc << ")" << std::endl;
//	reconnect_async();
	reconnect();
 }

void MQTTJbbs::on_connect(int rc) {

	fun_on_connect(rc);
 }
void MQTTJbbs::on_message(const struct mosquitto_message *message) {

	fun_on_message(message);
 }
