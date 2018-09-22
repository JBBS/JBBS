#ifndef JBBSCOMMONS_H
#define JBBSCOMMONS_H

#include <cstdio>
#include <iostream>

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

//
const int LCD_ADDR				= 0x3F; 			// Indirizzo LCD
const int LCD_BASE				= 300;

struct GlobalStatus {
	int spargeTarget	= 0; 		// Messaggio di impostazione temperatura acqua di Sparge
	bool spargeStart	= false; 	// Messaggio di inizio sparge da Mash a Sparge
	bool boilReady		= false;  	// Messaggio di pronto allo sparge da boil a Sparge
 } ;



// Costanti varie
static const char On = true;
static const char Off = false;

static const bool Ricircolo = false;
static const bool Scarico = true;

// Costanti per l'indicatore del trend in dashboard
static const int trendOff = -2;
static const int trendUp = 1;
static const int trendSteady = 0;
static const int trendDown = -1;

// Costanti per MQTT
const std::string SpargeMqttID = "sparge";
const std::string MashMqttID = "mash";
const std::string BoilMqttID = "boil";

#endif
