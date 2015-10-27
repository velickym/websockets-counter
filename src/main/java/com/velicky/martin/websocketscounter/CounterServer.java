package com.velicky.martin.websocketscounter;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Random;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Logger;

import javax.websocket.CloseReason;
import javax.websocket.CloseReason.CloseCodes;
import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import org.glassfish.tyrus.server.Server;

@ServerEndpoint(value = "/counter")
public class CounterServer {

    private Logger logger = Logger.getLogger(this.getClass().getName());
    private final Random random = new Random();
    private final AtomicBoolean running = new AtomicBoolean(false);
    
    private final String[] colors = {"GREEN", "BLUE", "RED"};
    private static final long MAX_SLEEP = 1000;
    
    /**
     * http://stackoverflow.com/questions/2546078/java-random-long-number-in-0-x-n-range
     */
    private long randomSleep() {
    	
	   long bits, val;
	   do {
	      bits = (random.nextLong() << 1) >>> 1;
	      val = bits % MAX_SLEEP;
	   } while (bits - val + (MAX_SLEEP - 1) < 0L);
	   
	   return val;
    }
    
    @OnOpen
    public void onOpen(Session session) {
        logger.info("Connection with client established: " + session.getId());
    }

    @OnMessage
    public void onMessage(final String action, final Session session) { 
        
    	switch (action) {
    	
	        case "start":
	            
	        	running.set(true);
	        	
	        	new Thread(new Runnable() {
					
					@Override
					public void run() {

						while (running.get()) {
							
							String color = colors[random.nextInt(3)];
							
							try {
								session.getBasicRemote().sendText(color);
							} catch (IOException e) {
								logger.severe("Couldn't send message: " + e.getMessage());
							}
							
							try {
								Thread.sleep(randomSleep());
							} catch (InterruptedException e) {
								CloseReason reason = new CloseReason(CloseCodes.UNEXPECTED_CONDITION, e.getMessage());
								onClose(session, reason);
							}
						}
						
						try {
							CloseReason reason = new CloseReason(CloseCodes.NORMAL_CLOSURE, "Finished.");
							session.close(reason);
						} catch (IOException e) {
							throw new RuntimeException("Couldn't gracefully close session", e);
						}
					}
				}, "Counter generator").start();
	        	
	        	break;
	        	
	        case "quit":
	        	logger.info("Stopping counter.");
	        	running.set(false);
	            break;
        }
    }

    @OnClose
    public void onClose(Session session, CloseReason reason) {
        logger.info(String.format("Session %s closed: %s", session.getId(), reason.getReasonPhrase()));
    }
    
    public static void main(String[] args) {
        
    	Server server = new Server("localhost", 8025, "/websockets", CounterServer.class);

        try {
            server.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
            System.out.print("Server started and waiting for client to connect. Press any key to stop the server.");
            reader.readLine();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            server.stop();
        }
    }
}
