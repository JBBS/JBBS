/*
 * DS18B20.h
 *
 *  Created on: 26 apr 2017
 *      Author: 401993
 */

#ifndef DS18B20_H_
#define DS18B20_H_

#include <cstdio>
#include <cstring>
#include <iostream>
#include <stdlib.h>     /* strtof */
#include "ownetapi.h"

class DS18B20 {
	std::string myTempAddress;

public:
	DS18B20(std::string id);
	virtual ~DS18B20();

	float const getTemp();
};

#endif /* DS18B20_H_ */
