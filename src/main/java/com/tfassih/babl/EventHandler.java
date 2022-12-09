package com.tfassih.babl;

import com.tfassih.babl.entities.UsersEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.server.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import static com.tfassih.babl.WebSocketConfiguration.*;
@Component
@RepositoryEventHandler(UsersEntity.class) // <1>
public class EventHandler {

    private final SimpMessagingTemplate websocket; // <2>

    private final EntityLinks entityLinks;

    @Autowired
    public EventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
        this.websocket = websocket;
        this.entityLinks = entityLinks;
    }

    @HandleAfterCreate // <3>
    public void newUser(UsersEntity user) {
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/newUser", getPath(user));
    }

    @HandleAfterDelete // <3>
    public void deleteUser(UsersEntity user) {
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/deleteUser", getPath(user));
    }

    @HandleAfterSave // <3>
    public void updateUser(UsersEntity user) {
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/updateUser", getPath(user));
    }

    private String getPath(UsersEntity user) {
        return this.entityLinks.linkForItemResource(user.getClass(),
                user.getId()).toUri().getPath();
    }

}