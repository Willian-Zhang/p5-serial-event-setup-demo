//Include needed libraries
#include <CapacitiveSensor.h>

CapacitiveSensor touchSensor = CapacitiveSensor(9,12);

//PINS
const int forcePin = A0;
const int photoPin = A1;
const int bendPin = A2;
const int tilt1Pin = 2;
const int tilt2Pin = 3;


//SENSOR VALUES
int forceValue;
int bendValue;
int photoValue;
int touchValue;
int tilt1Value;
int tilt2Value;

void setup() {

  //Pin mode settings
  pinMode(forcePin, INPUT);
  pinMode(bendPin, INPUT);
  pinMode(photoPin, INPUT);
  pinMode(tilt1Pin, INPUT);
  pinMode(tilt2Pin, INPUT);

  //initialize serial communication at 9600 bits per second
  Serial.begin(9600);
  
  
}

void loop() {
  // get sensor values
  forceValue = analogRead(forcePin);
  bendValue = 1024-analogRead(bendPin);
  photoValue = analogRead(photoPin);
  touchValue = touchSensor.capacitiveSensor(30);
  tilt1Value = digitalRead(tilt1Pin);
  tilt2Value = digitalRead(tilt2Pin);

//  //display sensor values
//  Serial.print("Force: "); Serial.print(forceValue);
//  Serial.print("\tBend: "); Serial.println(bendValue);
//  Serial.print("Photo: "); Serial.print(photoValue);
//  Serial.print("\tTouch: "); Serial.println(touchValue);
//  Serial.print("Tilt 1: "); Serial.print(tilt1Value);
//  Serial.print("\tTilt 2: "); Serial.println(tilt2Value);
//  Serial.println();

long start = millis();
//API format: <sensor1>\t<sensor2>\t<sensor3>\t<sensor4>\t<sensor5>\n
Serial.print(millis() - start);
Serial.print("\t");
Serial.print(forceValue);
Serial.print("\t");
Serial.print(bendValue);
Serial.print("\t");
Serial.print(photoValue);
Serial.print("\t");
Serial.print(touchValue);
Serial.print("\t");
Serial.print(tilt1Value);
Serial.print("\t");
Serial.print(tilt2Value);
Serial.print("\n");

  //delay to keep the arduino sane
  //delay(100);
}
