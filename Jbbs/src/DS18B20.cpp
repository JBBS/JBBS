/*
 * DS18B20.cpp
 *
 *  Created on: 26 apr 2017
 *      Author: 401993
 */

#include "DS18B20.h"

const char* OWSERVER = "4304"; // puntiamo a localhost

OWNET_HANDLE owNet;

DS18B20::DS18B20(std::string id) {

//	myTempAddress = "uncached/" + id + "/temperature";
	myTempAddress = id + "/temperature"; // prendo la temperatura cachata

	if ((owNet = OWNET_init(OWSERVER)) < 0) {
		std::cout << "OWNET_init failed." << std::endl;
	}
}

DS18B20::~DS18B20() {
	OWNET_close(owNet);
}

float const DS18B20::getTemp() {

	char * buf;
	char* end;

	if ((OWNET_read(owNet, myTempAddress.c_str(), &buf)) < 0 ) {
		std::cout << "ERROR! MASH Sens Temp read failed." << std::endl;
		return (85.0);
	} else {
		return (strtof(buf, &end));
	}
}

