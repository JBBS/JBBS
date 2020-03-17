#ifndef JBBSCOMMONS_H
#define JBBSCOMMONS_H

#include <cstdio>
#include <iostream>
#include "MQTTJbbs.h"


// Indirizzi Schede I/O expander
const int MCP23017 				= 0x20;				// Output expander per i rele'
const int MCP_BASE 				= 100;
const int GPIO_BIGFIRE 			= MCP_BASE;  		// gpio Fornello grande MASH
const int GPIO_SMALLFIRE 		= MCP_BASE + 1;  	// gpio Fornello piccolo BOIL
const int GPIO_MASHFIRE 		= MCP_BASE + 2;  	// gpio Fornello MASH
const int GPIO_SPARGEFIRE 		= MCP_BASE + 3;  	// gpio Fornello SPARGE
const int GPIO_PUMP 			= MCP_BASE + 4;  	// gpio Pompa
const int GPIO_RIC_SCA 			= MCP_BASE + 11;  	// gpio Valvola Ricircolo / Scarico
const int GPIO_MASHVALVE 		= MCP_BASE + 12;  	// gpio Valvola SPARGE verso Mash
const int GPIO_ALARM 			= MCP_BASE + 13;  	// gpio Cicalino

// Indirizzo I2C interfaccia 1wire: 0x18

const int PCF8574				= 0x38; 			// Input expander per i sensori
const int PCF_BASE				= 200;
const int GPIO_MASHLOLEVEL		= PCF_BASE + 6;		// gpio sensore di livello del mash
const int GPIO_MASHHILEVEL		= PCF_BASE + 7;
// const int GPIO_BOILHILEVEL		= PCF_BASE + 7;		// gpio sensore di livello del boil => Sensore livello BOIL


const int LCD_ADDR				= 0x3F; 			// Indirizzo LCD
const int LCD_BASE				= 300;


// Variabili di stato globali per la comunicazione con Node Red
struct GlobalStatus {
	bool spargeWarming 	= false;	// Stato del tun di sparge
	bool boilReady		= false;  	// Messaggio di pronto allo sparge da boil a Sparge
	class MQTTJbbs *mqttClient;

 } ;

// Costanti varie
const char ACCESO = true;
const char SPENTO = false;

const int PREALLARME = 5; // Minuti di anticipo per invio notifica fine step


const bool 	RICIRCOLO 		= false;
const bool 	SCARICO 		= true;
const int	SPARGETARGET	= 78;

const unsigned char MAXSTEP = 10;
//const int 			BOILTEMP = 99; // gradi ebollizione

// Costanti per l'indicatore del trend in dashboard
const int trendOff = -2;
const int trendUp = 1;
const int trendSteady = 0;
const int trendDown = -1;

// Costanti per MQTT
const std::string SpargeMqttID = "sparge";
const std::string MashMqttID = "mash";
const std::string BoilMqttID = "boil";

// Comandi MQTT
const std::string COMMAND_SMALLFIRE		= "smallfire";
const std::string COMMAND_BIGFIRE 		= "bigfire";
const std::string COMMAND_LOAD 			= "load";
const std::string COMMAND_LOADBOIL		= "loadboil";
const std::string COMMAND_SENDRECIPE	= "sendrecipe";
const std::string COMMAND_START 		= "start";
const std::string COMMAND_SPARGE 		= "sparge";
const std::string COMMAND_STOP			= "stop";
const std::string COMMAND_SETBOIL		= "setboil";
const std::string COMMAND_SETSTATUS		= "setstatus";
const std::string COMMAND_READY			= "ready";
const std::string COMMAND_PUMP 			= "pump";
const std::string COMMAND_FIRE 			= "fire";

#endif
