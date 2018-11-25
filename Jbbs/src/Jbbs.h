#ifndef JBBS_H
#define JBBS_H

// Include di sistema
#include <cstdio>
#include <cstring>
#include <iostream>
#include <unistd.h>
#include <chrono>
#include <thread>
#include <ctime>
#include <locale>

// Wiring PI Includes
#include <wiringPi.h>
#include <mcp23017.h>
#include <pcf8574.h>

// Json for modern c++
#include "json.hpp"

// Include locali
#include "JbbsCommons.h"
#include "JbbsLcd.h"
#include "Sparge.h"
#include "Mash.h"
#include "Boil.h"

void onConnectCallback(int rc);
void onMessageCallBack(const struct mosquitto_message* message);
bool setup();
void loop();

#endif
