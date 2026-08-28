# Stage 1: build the jar - pinned to JDK 21 specifically, not "latest".
# Lombok silently fails to generate code under JDK 26 (confirmed earlier this
# project via javap) - this guarantees the same bug can never reappear inside
# the container, regardless of what JDK happens to be on the host machine.
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn -B package -DskipTests

# Stage 2: run it - just a JRE, no Maven/JDK/source code carried over
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
