package com.tfassih.babl.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.context.annotation.Primary;

import java.io.Serializable;

@Entity
@Table(name = "users", schema = "public", catalog = "BABL")
public class UsersEntity implements Serializable {
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Id
    @Column(name = "id", nullable = false)
    private Long id;
    @Basic
    @Column(name = "user_name", nullable = true, length = -1)
    private String userName;
    @Basic
    @Column(name = "real_name", nullable = true, length = -1)
    private String realName;
    @Basic
    @Column(name = "location", nullable = true, length = -1)
    private String location;
    @Version @JsonIgnore
    private Long version;
    public UsersEntity(){}

    public UsersEntity(String userName, String realName, String location) {
        this.userName = userName;
        this.realName = realName;
        this.location = location;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getRealName() {
        return realName;
    }

    public void setRealName(String realName) {
        this.realName = realName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        UsersEntity that = (UsersEntity) o;

        if (id != null ? !id.equals(that.id) : that.id != null) return false;
        if (userName != null ? !userName.equals(that.userName) : that.userName != null) return false;
        if (realName != null ? !realName.equals(that.realName) : that.realName != null) return false;
        if (location != null ? !location.equals(that.location) : that.location != null) return false;
        if (version != null ? !version.equals(that.version) : that.version != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (userName != null ? userName.hashCode() : 0);
        result = 31 * result + (realName != null ? realName.hashCode() : 0);
        result = 31 * result + (location != null ? location.hashCode() : 0);
        result = 31 * result + (version != null ? version.hashCode() : 0);
        return result;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", userName='" + userName + '\'' +
                ", realName='" + realName + '\'' +
                ", Location='" + location + '\'' +
                ", version=" + version +
                '}';
    }
}
