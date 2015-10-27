package com.velicky.martin.websocketscounter;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.concurrent.CountDownLatch;
import java.util.logging.Logger;

import javax.websocket.ClientEndpoint;
import javax.websocket.CloseReason;
import javax.websocket.DeploymentException;
import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;

import org.glassfish.tyrus.client.ClientManager;

@ClientEndpoint
public class ClientMock {

    private static CountDownLatch latch;
    private Logger LOG = Logger.getLogger(this.getClass().getName());

    @OnOpen
    public void onOpen(Session session) {
        LOG.info("Connected to server: " + session.getId());
        try {
            session.getBasicRemote().sendText("start");
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @OnMessage
    public void onMessage(String color, Session session) {
    	System.out.println(color);
    }

    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        LOG.info(String.format("Session %s closed: %s", session.getId(), closeReason));
        latch.countDown();
    }

    public static void main(String[] args) {
        latch = new CountDownLatch(1);

        ClientManager client = ClientManager.createClient();
        try {
            client.connectToServer(ClientMock.class, new URI("ws://localhost:8025/websockets/counter"));
            latch.await();

        } catch (DeploymentException | URISyntaxException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}


